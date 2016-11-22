'use strict';

import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
const handlers = require('shortstop-handlers');
const shortstop = require('shortstop');
const kraken = require('kraken-js');

import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log: Logger = new Logger('SRVR');

/**
 * A server class which spins up an express server and uses kraken configuration.
 */
class Server {

    /** Internal config loader */
    private config: ConfigLoader;

    /**
     * Constructor
     * @param config - A config loader instance
     */
    constructor(config: ConfigLoader) {
        this.config = config;
    }

    /**
     * Starts the server and attaches some logging hooks.
     * @returns Promise which resolves on connection, rejects on error.
     */
    public async initialize(): Promise<void> {

        let krakenConfig = this.config.get('kraken');
        let port = await this.startServer(krakenConfig);

        Log.info(`Server has started successfully, listening on port ${port}.`);

    }

    /** 
     * Start the server 
     * @param - Kraken configuration object.
     * @returns Resolves if the server starts correctly, and returns the port number.
     */
    private startServer(krakenConfig: any): Promise<any> {
        return new Promise((resolve, reject) => {

            let app: any = express();
            let port: string = this.config.getEnv('SERVER_PORT');

            let krakenOptions: any = {
                // Uncaught exception handler
                uncaughtException: (err) => {
                    Log.fatal(err);

                    // CRASH
                    process.exit(1);
                },
                // Kraken parses short-stop before onconfig is called... WAI?
                onconfig: (config, callback) => {
                    config.use(krakenConfig);
                    callback(null, config);
                }
            };

            Log.info(`Starting the server on port ${port}...`);

            app.use(kraken(krakenOptions));

            app.on('middleware:before', (event: any) => {
                let middlewarePath = event.config.name;

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

        });
    }

}

export { Server }
