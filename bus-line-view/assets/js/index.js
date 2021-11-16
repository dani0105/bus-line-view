let map = new ol.Map({
    target: 'map',
    layers: [],
    view: new ol.View({
        projection: 'EPSG:4326',
        center: [-84.41, 10.37],
        zoom: 8
    })
});

var selectInteraction = new ol.interaction.Select();


let source = null;
let target = null;

let paradasLayer;

var estilo_selected = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 7.5,
        fill: new ol.style.Fill({ color: 'red' }),
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
    map = new ol.Map({
        target: 'map',
        layers: [new ol.layer.Tile({ source: new ol.source.OSM() })],
        view: new ol.View({
            projection: 'EPSG:4326',
            center: [-84.41, 10.37],
            zoom: 8
        })
    });
    loadFeatures()
    
    map.addInteraction(selectInteraction);
    selectInteraction.on('select', e => {
        const feature = e.selected[0]; // en feature.W esta el id de la figura
        

        if(!source){
            source = feature;
            feature.setStyle(estilo_selected);
            console.log("Source")
            return;
        }

        if(!target){
            console.log("target")
            target = feature;
            feature.setStyle(estilo_selected);
            return;
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