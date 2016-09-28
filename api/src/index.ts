'use strict';

/** Set up DI */
import './loader';

import { Injector } from './lib/injector';

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { Validator } from './lib/validator';

const validator = Injector.request<Validator>('Validator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const server = Injector.request<Server>('Server');

/** Initialize the libraries. */
Promise.resolve()
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
    console.log('Shutting down gracefully...');
    setTimeout(process.exit, 0, 0);
});
