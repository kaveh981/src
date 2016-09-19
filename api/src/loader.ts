'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

/** Lib */
import { Injector } from './lib/injector';
import { ConfigLoader } from './lib/config-loader';

// Logger forces us to load the config before importing anything else.
const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { Validator } from './lib/validator';

/** Models */
import { UserManager } from './models/user/user-manager';

/** Dependency Resolution */
const validator = new Validator();
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(config);
Injector.put(server, 'Server');

const userManager = new UserManager(databaseManager);
Injector.put(userManager, 'UserManager');
