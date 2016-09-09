'use strict';

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { Config } from './lib/config';
import { Validator } from './lib/validator';

import { BuyerModel } from './models/buyers';

Promise.resolve()
    .then(() => {
        return Validator.initialize();
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
