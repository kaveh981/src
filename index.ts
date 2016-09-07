'use strict';

import * as express from 'express';
import * as http from 'http';

import { Server } from './server';
import { DatabaseManager } from './lib/database-manager';

DatabaseManager.initialize()
    .then(() => {
        Server.start();
    })
    .catch((err: ErrorEvent) => {
        // Clean up.
    });
