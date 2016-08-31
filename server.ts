'use strict';

import * as express from 'express';
import * as http from 'http';

let app: express.Application = require('./index');
let port: number = process.env.PORT || 8000;

/*
 * Create and start HTTP server.
 */
let server: http.Server = http.createServer(app);
server.listen(port);
server.on('listening', () => {
    console.log('Server listening on http://localhost:%d', server.address().port);
});
