'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Injector } from './lib/injector';
import { Config } from './lib/config-loader';
import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';

import { Validator } from './lib/validator';

const validator = new Validator();
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(Config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(Config);
Injector.put(server, 'Server');

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
