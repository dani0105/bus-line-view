CREATE DATABASE bus_line_view;

-- Extension de postgis
CREATE EXTENSION postgis;

-- importar los datos de un archivo .gpkg
--ogr2ogr -f PostgreSQL PG:"host=localhost port=5432 dbname=bus_line_view user=postgres password=contraseña" ./rutas.gpkg

-- Extencion de routing
CREATE EXTENSION pgrouting;

-- Tabla para la secciones de carretera entre paradas
CREATE TABLE carreteras(
    id serial primary key,
    distancia float null,
    source int,
    target int
);

SELECT AddGeometryColumn ('public','carreteras','geom',4326,'LINESTRING',2);

-- Tabla para las paradas de buses
CREATE TABLE paradas(
    id serial primary key
);

SELECT AddGeometryColumn ('public','paradas','geom',4326,'POINT',2);

-- crear los source y los targets de carreteras con respecto a las paradas
UPDATE carreteras
SET 
	target=subquery.target,
    source=subquery.source
FROM (
		SELECT carr.id,p.id as source, p2.id as target
     	FROM carreteras as carr
		inner join paradas P ON P.geom = ST_StartPoint(carr.geom)
		inner join paradas P2 ON P2.geom = ST_EndPoint(carr.geom)
) AS subquery
WHERE carreteras.id=subquery.id;


-- establesco la distancia de los segmentos
UPDATE carreteras set distancia=st_length(geom);

-- trae la capa de paradas 
CREATE OR REPLACE FUNCTION public.get_bus_stops(

) 
RETURNS table(
    geomJson jsonb 
)
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    RETURN QUERY SELECT jsonb_build_object( 
        'type',
        'FeatureCollection',
        'features',
        jsonb_agg(feature)
    )FROM (
    SELECT jsonb_build_object(
        'type',       'Feature',
        'id',         id,
        'geometry',   ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(row) - 'id' - 'geom'
    ) AS feature
    FROM (
        SELECT
            P.id,
            st_transform(geom,4326)as geom 
        FROM
            public.paradas P
    ) row) features;
END;
$BODY$;

-- consigue las paradas por las que debe pasar
CREATE OR REPLACE FUNCTION public.get_bus_stop(
    _source int,
    _target int
) 
RETURNS TABLE(
    id int, -- id de la parada 
    seq int,
    geom geometry -- geometria de la parada
)
LANGUAGE 'plpgsql'
AS $BODY$
begin
    CREATE TEMP TABLE _temp ON COMMIT DROP AS
        SELECT
            *
        from 
            pgr_dijkstra(
                concat('SELECT id,source, target, distancia as cost FROM public.carreteras'),
                _source,
                _target,
                directed => false);

    return query (select v.id,r.seq, v.geom 
                    from _temp r 
                    inner join 
                    public.paradas as v on (
    r.node=v.id
    ));
end
$BODY$;

-- funcion para calcular las rutas que debe usar
CREATE OR REPLACE FUNCTION public.get_bus_routes(
    _source int,
    _target int
) 
RETURNS TABLE(
    geomJson jsonb 
)
LANGUAGE 'plpgsql'
AS $BODY$
declare
    _id int; -- id de la parada 
    _seq int;
    _geom geometry; -- geometria de la parada

    _is_start_point boolean;
    _start_id int;
    _id_ant int;
    _search_radius double precision;

begin
    _is_start_point = true;
    _search_radius = 0.002;
    _seq = 1;

    -- pardas por las que se deben pasar
    create temp TABLE _temp_paradas ON COMMIT DROP AS -- paradas por las que se deben pasar
        select 
            id,
            geom
        from 
            get_bus_stop(_source, _target);

    -- rutas que pasan por las paradas que se deben usar
    create temp table _temp_rutas ON COMMIT DROP AS -- rutas que pasan por las paradas 
        SELECT
            distinct R.fid as id,
            R.geom as geom,
            null::int as seq,
            null::int as start_id,
            null::int as end_id,
            R.rutactp2019
        from
            rutas R
        inner join _temp_paradas P ON ST_DWithin(R.geom,P.geom,_search_radius);


    FOR _id, _geom IN SELECT * FROM _temp_paradas
    LOOP
        if( _is_start_point ) THEN -- marco las rutas que pasan por la parada inicial
            _is_start_point = false;
            _start_id = _id;

            update _temp_rutas set
                start_id = _id,
                seq = _seq
            from (
                select TR.id from _temp_rutas TR where (TR.start_id is null or TR.start_id = _id) AND ST_DWithin(TR.geom,_geom,_search_radius)
            ) as subquery
            where
                _temp_rutas.id = subquery.id;
        ELSE
            --rutas que pasan por la parda y vienen del punto de inicio
            if( EXISTS(select TR.id from _temp_rutas TR where TR.start_id = _start_id and ST_DWithin(TR.geom, _geom,_search_radius)  ) ) THEN 

                update _temp_rutas set
                        end_id = _id,
                        seq = _seq
                    from (
                        select TR.id from _temp_rutas TR where TR.start_id = _start_id and ST_DWithin(TR.geom,_geom,_search_radius)
                    ) as subquery
                    where
                        _temp_rutas.id = subquery.id;
            ELSE 
                --no hay rutas que pasan por la parada y venngan del punto inicial
                
                -- la anterior fue la ultima que venian del punto inicial
                _start_id = _id_ant; 
                _seq = _seq +1;
                update _temp_rutas set
                    start_id = _id_ant,
                    seq = _seq
                from (
                    select TR.id from _temp_rutas TR where (TR.start_id is null or TR.start_id = _id_ant) AND ST_DWithin(TR.geom,_geom,_search_radius)
                ) as subquery
                where
                    _temp_rutas.id = subquery.id;
            END IF;


        END IF;
        _id_ant = _id;
    END LOOP;

    DELETE from _temp_rutas
            WHERE  
                _temp_rutas.start_id is null or
                _temp_rutas.end_id is null;


    -- retorna el geojson
    RETURN QUERY SELECT jsonb_build_object( 
        'type',
        'FeatureCollection',
        'features',
        jsonb_agg(feature)
    )FROM (
    SELECT jsonb_build_object(
        'type',       'Feature',
        'id',         id,
        'geometry',   ST_AsGeoJSON(geom)::jsonb,
        'properties', to_jsonb(row) - 'id' - 'geom'
    ) AS feature
    FROM (
        select 
            R.id, -- id de la ruta
            R.geom, -- figura de la ruta
            R.seq, -- sequencia de la ruta 
            R.start_id, -- id de la parada de inicio
            S.geom as start_geom, -- figura de la parada de inicio
            R.end_id, -- id de la parada de llegada
            E.geom as end_geom, -- figura de la parada de llegada
            R.rutactp2019
        from 
            _temp_rutas R
        inner join paradas S ON S.id = R.start_id
        inner join paradas E ON E.id = R.end_id
        WHERE 
            R.end_id IN (
                select R2.start_id from _temp_rutas R2 
            ) or
            R.end_id = _target
        order by R.seq ASC
    ) row) features;

end
$BODY$;