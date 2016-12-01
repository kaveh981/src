'use strict';

/** Set up DI */
import './loader';

import { Injector } from './lib/injector';

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { RamlTypeValidator } from './lib/raml-type-validator';
import { ConfigLoader } from './lib/config-loader';

const validator = Injector.request<RamlTypeValidator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const server = Injector.request<Server>('Server');
const configLoader = Injector.request<ConfigLoader>('ConfigLoader');

/** Initialize the libraries. */
Promise.resolve()
    .then(() => {
        return configLoader.initialize({ 'mw': './src/middleware' });
    })
    .then(() => {
        return validator.initialize();
    })
    .then(() => {
        return databaseManager.initialize();
    })
    .then(() => {
        return server.initialize();
    })
    .catch((err: Error) => {
        // Clean up.
        databaseManager.shutdown();
    });

process.on('SIGTERM', () => {
    setTimeout(process.exit, 0, 0);
});
