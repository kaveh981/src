'use strict';

import * as express from 'express';
import * as http from 'http';

import { Logger } from './lib/logger';

const Log: Logger = new Logger('SRVR');

const kraken: Function = require('kraken-js');

export class Server {

    // Starts the server
    public static start(): void {

        Log.info('Starting the server...');

        let app: express.Application = express();
        let port: number = process.env.PORT || 8000;

        app.use(kraken());

        let server: http.Server = http.createServer(app);

        server.on('listening', () => {
            Log.info(`Server listening on http://localhost:${server.address().port}.`);
        });

        server.listen(port);
    }

}
