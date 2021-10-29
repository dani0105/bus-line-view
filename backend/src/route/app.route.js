var router = require('express').Router();
var HttpStatus = require('http-status-codes').StatusCodes;
var controller = require('../controller').appController;

router.get('/home', (req, res, next) => {
    controller.home().then( result => {
        res.status(HttpStatus.OK).json(result)
    }).catch( error => {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send("Error")
    });
});

module.exports = router;