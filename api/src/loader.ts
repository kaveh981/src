'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Injector } from './lib/injector';
import { ConfigLoader } from './lib/config-loader';

// Logger forces us to load the config before importing anything else.
const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { Validator } from './lib/validator';

import { UserManager } from './models/user/user-manager';

const validator = new Validator();
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(config);
Injector.put(server, 'Server');

const userManager = new UserManager(databaseManager);
Injector.put(userManager, 'UserManager');

function LoadDependencies(): Promise<void> {
    return Promise.resolve()
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
}

export { LoadDependencies }
