'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */

import * as express from 'express';
import * as http from 'http';
import * as Promise from 'bluebird';

/** Lib */
import { Injector } from './lib/injector';
import { ConfigLoader } from './lib/config-loader';
import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { RamlTypeValidator } from './lib/raml-type-validator';
import { ErrorCreator } from './lib/error-creator';

/** Models */
import { UserManager } from './models/user/user-manager';
import { BuyerManager } from './models/buyer/buyer-manager';
import { ProposedDealManager } from './models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from './models/deals/negotiated-deal/negotiated-deal-manager';
import { SettledDealManager } from './models/deals/settled-deal/settled-deal-manager';

/** Dependency Resolution */
const config = new ConfigLoader('../../config');
Injector.put(config, 'ConfigLoader');

const validator = new RamlTypeValidator(config);
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(config);
Injector.put(server, 'Server');

const errorCreator = new ErrorCreator();
Injector.put(errorCreator, 'ErrorCreator');

const userManager = new UserManager(databaseManager);
Injector.put(userManager, 'UserManager');

const buyerManager = new BuyerManager(databaseManager, userManager);
Injector.put(buyerManager, 'BuyerManager');

const proposedDealManager = new ProposedDealManager(databaseManager, userManager);
Injector.put(proposedDealManager, 'ProposedDealManager');

const negotiatedDealManager = new NegotiatedDealManager(databaseManager, proposedDealManager, userManager);
Injector.put(negotiatedDealManager, 'NegotiatedDealManager');

const settledDealManager = new SettledDealManager(databaseManager, negotiatedDealManager);
Injector.put(settledDealManager, 'SettledDealManager');
