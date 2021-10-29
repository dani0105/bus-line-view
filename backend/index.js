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

// Server routes
app.use(route.app);



// Start server 
app.listen(app.get('port'),() => {
    console.log(`server running in http://localhost:${app.get('port')}`);
});