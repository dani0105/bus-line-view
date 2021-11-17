//Inisializacion del mapa
let map = new ol.Map({
    target: 'map',
    layers: [],
    view: new ol.View({
        projection: 'EPSG:4326',
        center: [-84.41, 10.37],
        zoom: 8
    })
});

//Inisializacion de la parada de salida y llegada
let source = null;
let target = null;

//Inicializacion de las capas de paradas y rutas
let layerParadas;
let layerRutas;

//Variables para uso de interfaz
var startText, endText, searchButton, linesList;

//Controlador de seleccion en el mapa
var selectInteraction = new ol.interaction.Select();

//Estilo de la parada seleccionada como inicio
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

//Estilo de la parada seleccionada como llegada
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

//Estilo para mostrar las paradas
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

//Estilo para mostrar las rutas
var estilo_calles = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: [204, 204, 255],
        width: 10,
    }),
});

//Funcion que se ejecuta al cargar la pagina, inicializa el mapa y la interfaz, y carga las paradas
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
    load_Stops()

    startText = document.getElementById('start-point');
    endText = document.getElementById('end-point');
    searchButton = document.getElementById('search-button');
    linesList = document.getElementById("lines");
    searchButton.disabled = true
    map.addInteraction(selectInteraction);
    selectInteraction.on('select', e => {
        var feature = e.selected[0]; // en feature.W esta el id de la figura
        if (feature) {
            if (!source) {
                source = feature;
                startText.innerText = `${feature.W}`

            } else if (!target) {
                target = feature;
                endText.innerText = `${feature.W}`
                searchButton.disabled = false;
            } else {
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

//Funcion para estilizar las paradas seleccionadas
function highlightFeature() {
    if (source) {
        source.setStyle(estilo_source);
    }

    if (target) {
        target.setStyle(estilo_target);
    }
}

//Funcion que carga las paradas de la data base y las agrega al mapa
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

//Elimina la seleccion de paradas
function deselect() {
    source.setStyle(estilo_paradas);
    target.setStyle(estilo_paradas);
    source = null;
    target = null;
}

//Envia las paradas seleccionadas al backend para que este calcule las ruta, agregas estas rutas al mapa
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

//LLena la lista de informacion de rutas
function fillList(routes) {

    for (let i = 0; i < routes.length; i++) {
        const element = routes[i];
        var tag = document.createElement("li");
        tag.className = 'line-item'
        var text = document.createTextNode(`(${element.properties.seq}) ${element.id} - ${element.properties.rutactp2019}`);
        tag.appendChild(text);
        linesList.appendChild(tag);
    }
}