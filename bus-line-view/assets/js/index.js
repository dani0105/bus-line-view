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
let layerParadas;
let layerRutas;

var startText,endText,searchButton,linesList;

var selectInteraction = new ol.interaction.Select();

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
        color: [204, 204, 255],
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

    startText = document.getElementById('start-point');
    endText =  document.getElementById('end-point');
    searchButton = document.getElementById('search-button');
    linesList = document.getElementById("lines");
    searchButton.disabled = true
    map.addInteraction(selectInteraction);
    selectInteraction.on('select', e => {
        var feature = e.selected[0]; // en feature.W esta el id de la figura
        if (feature) {
            if(!source){
                source = feature;
                startText.innerText = `${feature.W}`
            
            }else if (!target){
                target = feature;
                endText.innerText = `${feature.W}`
                searchButton.disabled = false;
            }else{
                map.removeLayer(layerRutas);
                searchButton.disabled = true;
                linesList.innerHTML = '';
                target.setStyle(estilo_paradas);
                source.setStyle(estilo_paradas);
                source = feature;
                startText.innerText = `${feature.W}`
                endText.innerText = 'Seleccionar'
                target = null;
            }
        }
        highlightFeature()
    })
}

function highlightFeature(){
    if(source){
        source.setStyle(estilo_source);
    }

    if(target){
        target.setStyle(estilo_target);
    }
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
        console.log(response.status);
        vs = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(response.data.data)
        });
        layerParadas = new ol.layer.Vector({
            source: vs,
            style: estilo_paradas
        });
        map.addLayer(layerParadas);


    })
}

function deselect() {
    source.setStyle(estilo_paradas);
    target.setStyle(estilo_paradas);
    source = null;
    target = null;
}

function calcRoute() {
    axios({
        method: 'get',
        url: 'http://localhost:8081/bus-lines',
        params: {
            start: source.getId(),
            end: target.getId()
        }
    }).then(response => {
        map.removeLayer(layerParadas);
        
        console.log(response.status);
        vs = new ol.source.Vector({
            features: new ol.format.GeoJSON().readFeatures(response.data.data)
        });
        layerRutas = new ol.layer.Vector({
            source: vs,
            style: estilo_calles
        });
        map.addLayer(layerRutas);
        map.addLayer(layerParadas);
        fillList(response.data.data.features)
    })
}

function fillList(routes){
    
    for(let i = 0; i < routes.length; i++){
        const element = routes[i];
        var tag = document.createElement("li");
        tag.className = 'line-item'
        var text = document.createTextNode(`(${element.properties.seq}) ${element.id} - ${element.properties.rutactp2019}`);
        tag.appendChild(text);
        linesList.appendChild(tag);
    }
}