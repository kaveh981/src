'use strict';

import * as express from 'express';
import * as http from 'http';
const meddleware = require('meddleware');

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

        let middlewareConfig = this.config.get('middleware');
        let port = await this.startServer(middlewareConfig, this.config.get('express'));

        Log.info(`Server has started successfully, listening on port ${port}.`);

        if (this.config.getEnv('NODE_ENV') === 'development') {
            Log.warn('Running the server in development mode.');
        }

    }

    /** 
     * Start the server 
     * @param - Kraken configuration object.
     * @returns Resolves if the server starts correctly, and returns the port number.
     */
    private startServer(middlewareConfig: any, expressConfig: any) {

        let app: any = express();
        let port = expressConfig['port'];

        Log.info(`Starting the server on port ${port}...`);

        // Set express config
        for (let key in expressConfig) {
            Log.trace(`Setting express ${key} to ${expressConfig[key]}`);
            app.set(key, expressConfig[key]);
        }

        // Debugging for loading middleware
        app.on('middleware:before', (event: any) => {
            let middlewarePath = event.config.name;

            if (event.config.enabled === false) {
                return;
            }

            if (middlewarePath) {
                Log.debug(`Loading middleware ${middlewarePath}...`);
            } else {
                Log.debug(`Loading un-named middleware...`);
            }
        });

        // Crash on uncaught error
        process.on('uncaughtException', (err: Error) => {
            Log.fatal(err);
            process.exit(1);
        });

        // Use the middleware configuration
        app.use(meddleware(middlewareConfig));

        let server = http.createServer(app);

        // Start the server
        return new Promise((resolve, reject) => {
            server.listen(port, (error: Error) => {
                if (error) {
                    Log.error(error);
                    reject(error);
                }
                resolve(port);
            });
        });

    }

}

export { Server }
