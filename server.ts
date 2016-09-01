'use strict';

import * as express from 'express';
import * as http from 'http';

let kraken: Function = require('kraken-js');

let app: express.Application = express();
let port: number = process.env.PORT || 8000;

app.use(kraken());

let server: http.Server = http.createServer(app);
server.on('listening', () => {
    console.log('Server listening on http://localhost:%d', server.address().port);
});

function startServer(): void {
    server.listen(port);
}

module.exports = startServer;

