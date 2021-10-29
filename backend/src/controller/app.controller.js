const pool = require('../util/index').database;

exports.home = async (req) => {
    const client = await pool.connect();

    var result = await client.query("SELECT * from comment").then( result => result.rows);

    client.release();
    return result;
}

module.exports;