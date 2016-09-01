'use strict';

import * as express from 'express';
import * as http from 'http';

import { DatabaseManager } from './lib/database-manager';

let startServer: Function = require('./server');

DatabaseManager.initialize();

startServer();
