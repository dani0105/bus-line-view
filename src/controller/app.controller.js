const pool = require('../util/index').database;
var HttpStatus = require('http-status-codes').StatusCodes;

// funcion para calcular las rutas entre dos paradas
exports.getBusLines = async (req, res ,next) => {
    const client = await pool.connect();
    try{
        // ejecuta el procedimiento que trae las rutas
        var result = await client.query("SELECT * from get_bus_routes($1, $2)",[
            req.query.start,
            req.query.end
        ]).then( result => result.rows[0].geomjson);

        // retorna la respuesta al cliente 
        res.status(HttpStatus.OK).json({success:true,data:result});
        
        client.release();
    }catch( error) {
        client.release();
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({success:false,data:null});
    }
}

// funcion para extraer la capa de paradas
exports.getBusStops = async (req, res ,next) => {
    const client = await pool.connect();
    try{
        // ejecuta el procedimiento que trae las paradas 
        var result = await client.query("SELECT * from get_bus_stops()").then( result => result.rows[0].geomjson);   
        // retorna la respuesta al cliente 
        res.status(HttpStatus.OK).json({success:true,data:result});
        client.release();

    }catch( error) {
        console.log(error)
        client.release();
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({success:false,data:null});
    }
}

module.exports;