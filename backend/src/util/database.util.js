var pg = require('pg')

var pool = new pg.Pool({
    user: process.env.DATABASE_USER,
    database: process.env.DATABASE_NAME,
    password: process.env.DATBASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    max: 100,
    idleTimeoutMillis: 30000
});

module.exports = pool;