let map;

function onLoad(){
    //Instancia principal del objeto mapa de open layer
    map = new ol.Map({
            target: 'map',//Contenedor html
            layers: [ // Capas iniciales
                new ol.layer.Tile({ source: new ol.source.OSM() })            
            ],
            //vista inicial: desplazamiento y nivel de acercamiento
            view: new ol.View({ 
                projection: 'EPSG:4326', 
                center: [-84.41, 10.37], 
                zoom: 12 
            })    
        });

    loadFeatures();
}

function loadFeatures(){
    // cargar figura quemada 
}
