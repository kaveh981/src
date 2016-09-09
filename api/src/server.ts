'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Logger } from './lib/logger';
import { Config } from './lib/config';

const Log: Logger = new Logger('SRVR');

const kraken: Function = require('kraken-js');

class Server {

    // Starts the server
    public static initialize(): Promise<{}> {
        return new Promise((resolve: Function, reject: Function) => {
            let app: express.Application = express();
            let port: string = Config.getVar('SERVER_PORT');

            Log.info(`Starting the server on port ${port}...`);

            app.use(kraken());

            let server: http.Server = http.createServer(app);

            server.on('listening', () => {
                Log.info(`Server has started successfully, listening on port ${port}.`);
                resolve();
            });

            server.on('error', (err: ErrorEvent) => {
                Log.error(err.toString());
                reject();
            });

            server.listen(port);
        })
        .catch((err: ErrorEvent) => {
            Log.error(err.toString());
            throw err;
        });
    }

}

export { Server }
