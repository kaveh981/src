'use strict';

import * as express from 'express';
import * as http from 'http';

import { DatabaseManager } from './lib/database-manager';

let startServer: Function = require('./server');

console.log("Initializing DatabaseManager...");

DatabaseManager.initialize()
    .then(() => {
        console.log("DatabaseManager initialized.");
        console.log("Starting server...");
        startServer();
    });
