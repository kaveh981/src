'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';
import * as path from 'path';

import { Logger } from './logger';
import { Config } from './config';

const Log: Logger = new Logger('SRVR');

const basedir: string = path.join(__dirname, '../');

const krakenOptions: any = {
    basedir: basedir
};

const kraken: Function = require('kraken-js');

class Server {

    // Starts the server
    public static initialize(): Promise<void> {
        return new Promise((resolve: Function, reject: Function) => {
            let app: any = express();
            let port: string = Config.getVar('SERVER_PORT');

            Log.info(`Starting the server on port ${port}...`);

            app.use(kraken(krakenOptions));

            app.on('middleware:before', (event: any) => {
                let middlewarePath = event.config.module.name;

                if (middlewarePath) {
                    Log.debug(`Loading middleware ${middlewarePath.split('\\').pop()}...`);
                } else {
                    Log.debug(`Loading un-named middleware...`);
                }
            });

            app.on('start', () => {
                resolve(port);
            });

            let server: http.Server = http.createServer(app);

            server.on('error', (err: Error) => {
                Log.error(err);
                reject(err);
            });

            server.listen(port);
        })
        .then((port: string) => {
           Log.info(`Server has started successfully, listening on port ${port}.`);
        })
        .catch((err: Error) => {
            Log.error(err);
            throw err;
        });
    }

}

export { Server }
