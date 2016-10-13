'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';
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

    /** Kraken base directory */
    private baseDir = '../';

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
    public initialize(): Promise<void> {
        return this.createHandlers(this.config.get('kraken'))
            .then((krakenConfig) => {
                return this.startServer(krakenConfig);
            })
            .then((port) => {
                Log.info(`Server has started successfully, listening on port ${port}.`);
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    /** 
     * Start the server 
     * @param - Kraken configuration object.
     * @returns Resolves if the server starts correctly, and returns the port number.
     */
    private startServer(krakenConfig: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let app: any = express();
            let port: string = this.config.getVar('SERVER_PORT');

            let krakenOptions: any = {
                // Kraken needs this or else it complains, but it's not necessary.
                basedir: path.join(__dirname, this.baseDir),

                // Uncaught exception handler
                uncaughtException: (err) => {
                    Log.error(err);
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
        });
    }

    /** 
     * Resolve the shortstop notation for config. Currently only supports 'path:'
     * @param config - The config object to resolve shortstop.
     * @returns A promise for the kraken config with shortstops resolved.
    */
    private createHandlers(config: any): Promise<any> {
        return new Promise((resolve, reject) => {
            let resolver = shortstop.create();

            resolver.use('path', handlers.path(path.join(__dirname, this.baseDir)));

            resolver.resolve(config, (err, data) => {
                if (err) {
                    Log.error(err);
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

}

export { Server }
