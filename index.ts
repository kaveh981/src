'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Server } from './server';
import { DatabaseManager } from './lib/database-manager';
import { BuyerModel } from './models/buyers';
import { Config } from './lib/config';

Promise.resolve()
    .then(() => {
        return Config.initialize();
    })
    .then(() => {
        return DatabaseManager.initialize();
    })
    .then(() => {
        return Server.initialize();
    })
    .catch((err: ErrorEvent) => {
        // Clean up.
        DatabaseManager.shutdown();
    });
