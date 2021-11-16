let map = new ol.Map({
    target: 'map',
    layers: [],
    view: new ol.View({
        projection: 'EPSG:4326',
        center: [-84.41, 10.37],
        zoom: 8
    })
});

let source = null;
let target = null;

let paradasLayer;

var estilo_source = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 7.5,
        fill: new ol.style.Fill({ color: 'red' }),
        stroke: new ol.style.Stroke({
            color: 'white',
            width: 2.5
        })
    })
});

var estilo_target = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 7.5,
        fill: new ol.style.Fill({ color: 'yellow' }),
        stroke: new ol.style.Stroke({
            color: 'white',
            width: 2.5
        })
    })
});

var estilo_paradas = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 7.5,
        fill: new ol.style.Fill({ color: 'blue' }),
        stroke: new ol.style.Stroke({
            color: 'white',
            width: 2.5
        })
    })
})

var estilo_calles = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: [212, 176, 135],
        width: 10,
    }),
});

function onLoad() {
    var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(8),
        projection: 'EPSG:4326',
    });

    map = new ol.Map({
        controls: ol.control.defaults().extend([mousePositionControl]),
        target: 'map',
        layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
        view: new ol.View({
            projection: 'EPSG:4326',
            center: [-84.41, 9.60],
            zoom: 8.25
        })
    });
    loadFeatures()
    map.on('click', function(e) {
        var coordsP = map.getCoordinateFromPixel(e.pixel);
        const ft = map.getClosestFeatureToCoordinate(e.pixel);
        var coordsF = ft.getGeometry().getCoordinates();
        console.log("Pixel ", coordsP, "Feature ", coordsF);
        if (!ft) {
            return;
        }
        if (source === null) {
            source = ft;
            ft.setStyle(estilo_source);
        } else if (target === null) {
            target = ft;
            ft.setStyle(estilo_target);
        } else {
            if (source === ft) {
                source = null;
                ft.setStyle(estilo_paradas);
            } else if (target === ft) {
                target = null;
                ft.setStyle(estilo_paradas);
            }
        }
    })
}

function loadFeatures() {
    load_Roads();
    load_Stops();
}

function load_Roads() {
    //
}

function load_Stops() {
    axios.get("http://localhost:8081/bus-stops").then(response => {
        paradasLayer = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(response.data.data)
        });
        vl = new ol.layer.Vector({
            source: paradasLayer,
            style: estilo_paradas
        });
        map.addLayer(vl);
    })
}

function deselect() {
    source.setStyle(estilo_paradas);
    target.setStyle(estilo_paradas);
    source = null;
    target = null;
}

function calcRoute() {
    const source = selected[0];
    const target = selected[1];
}