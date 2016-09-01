'use strict';

import * as express from 'express';
import * as http from 'http';

import {Server} from './server';
import { DatabaseManager } from './lib/database-manager';

console.log("Initializing DatabaseManager...");

DatabaseManager.initialize()
    .then(() => {
        console.log("DatabaseManager initialized.");
        console.log("Starting server...");
        Server.start();
    });
