import {Injector} from "./node_modules/raml-typesystem/dist/src/nominal-types";
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
import { Validator } from './lib/validator';

/** Models */
import { UserManager } from './models/user/user-manager';
import { BuyerManager } from './models/buyer/buyer-manager';
import { PackageManager } from './models/package/package-manager';
import { NegotiationManager } from './models/deal-negotiation/negotiation-manager';
import { ContactManager } from './models/contact-info/contact-manager';
import { DealManager } from './models/deal/deal-manager';

/** Tests */
import {DataSetup} from '../../../test/helper/dataSetup.helper'

/** Dependency Resolution */
const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

const validator = new Validator();
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(config);
Injector.put(server, 'Server');

const userManager = new UserManager(databaseManager);
Injector.put(userManager, 'UserManager');

const contactManager = new ContactManager(databaseManager);
Injector.put(contactManager, 'ContactManager');

const buyerManager = new BuyerManager(databaseManager, contactManager);
Injector.put(buyerManager, 'BuyerManager');

const packageManager = new PackageManager(databaseManager);
Injector.put(packageManager, 'PackageManager');

const negotiationManager = new NegotiationManager(databaseManager);
Injector.put(negotiationManager, 'NegotiationManager');

const dealManager = new DealManager(databaseManager);
Injector.put(dealManager, 'DealManager');

const dataSetup = new DataSetup(databaseManager);
Injector.put(dataSetup, 'DataSetup');
