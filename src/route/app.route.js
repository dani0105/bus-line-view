var router      = require('express').Router();
var controller  = require('../controller').appController;

// ruta para conseguir la capa de las rutas entre dos puntos
router.get('/bus-lines', controller.getBusLines);

// ruta para conseguir la capa de paradas 
router.get('/bus-stops', controller.getBusStops);

module.exports = router;