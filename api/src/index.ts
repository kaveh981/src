'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Injector } from './lib/injector';
import { Config } from './lib/config-loader';
import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { Validator } from './lib/validator';

import { UserModel } from './models/user';

const validator = new Validator();
const databaseManager = new DatabaseManager(Config);
const server = new Server(Config);

Promise.resolve()
    .then(() => {
        return validator.initialize()
            .then(() => {
                Injector.put(validator, 'Validator');
            });
    })
    .then(() => {
        return databaseManager.initialize()
            .then(() => {
                Injector.put(databaseManager, 'DatabaseManager');
            });
    })
    .then(() => {
        return server.initialize()
            .then(() => {
                Injector.put(server, 'Server');
            });
    })
    .catch((err: Error) => {
        // Clean up.
        databaseManager.shutdown();
    });

process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    setTimeout(process.exit, 0, 0);
});
