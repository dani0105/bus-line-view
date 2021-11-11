var router      = require('express').Router();
var controller  = require('../controller').appController;

router.get('/bus-lines', controller.getBusLines);
router.get('/bus-stops', controller.getBusStops);

module.exports = router;