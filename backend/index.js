require('dotenv').config();
const express       = require('express');
const app           = express();
const logger        = require('morgan');
const route         = require('./src/route/index')

// Server configuration
app.set('port', process.env.PORT || 8081);

app.use(logger('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Headers", "x-requested-with, content-type,Authorization");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// Server routes
app.use(route.app);



// Start server 
app.listen(app.get('port'),() => {
    console.log(`server running in http://localhost:${app.get('port')}`);
});