'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */

/** Lib */
import { Injector } from './lib/injector';
import { ConfigLoader } from './lib/config-loader';
import { Server } from './lib/server';
import { DatabaseManager } from './lib/database-manager';
import { RamlTypeValidator } from './lib/raml-type-validator';
import { Mailer } from './lib/mailer';
import { Notifier } from './lib/notifier';

/** Library Resolution */
const config = new ConfigLoader('../../');
Injector.put(config, 'ConfigLoader');

const validator = new RamlTypeValidator(config);
Injector.put(validator, 'Validator');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const server = new Server(config);
Injector.put(server, 'Server');

const mailer = new Mailer(config);
Injector.put(mailer, 'Mailer');

const notifier = new Notifier(config, [ mailer ]);
Injector.put(notifier, 'Notifier');

/** Models */
import { UserManager } from './models/user/user-manager';
import { MarketUserManager } from './models/market-user/market-user-manager';
import { DspManager } from './models/dsp/dsp-manager';
import { ProposedDealManager } from './models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from './models/deals/negotiated-deal/negotiated-deal-manager';
import { SettledDealManager } from './models/deals/settled-deal/settled-deal-manager';
import { DealSectionManager } from './models/deal-section/deal-section-manager';
import { SiteManager } from './models/site/site-manager';

/** Model Resolution */
const userManager = new UserManager(databaseManager);
Injector.put(userManager, 'UserManager');

const dspManager = new DspManager(databaseManager);
Injector.put(dspManager, 'DspManager');

const siteManager = new SiteManager(databaseManager);
Injector.put(siteManager, 'SiteManager');

const dealSectionManager = new DealSectionManager(databaseManager, siteManager);
Injector.put(dealSectionManager, 'DealSectionManager');

const marketUserManager = new MarketUserManager(databaseManager, userManager);
Injector.put(marketUserManager, 'MarketUserManager');

const proposedDealManager = new ProposedDealManager(databaseManager, marketUserManager, dealSectionManager);
Injector.put(proposedDealManager, 'ProposedDealManager');

const negotiatedDealManager = new NegotiatedDealManager(databaseManager, proposedDealManager, marketUserManager);
Injector.put(negotiatedDealManager, 'NegotiatedDealManager');

const settledDealManager = new SettledDealManager(databaseManager, negotiatedDealManager, dealSectionManager);
Injector.put(settledDealManager, 'SettledDealManager');

Promise.parallel = async (obj) => {

    let completeObject = {};

    await Promise.all(Object.keys(obj).map(async (key) => {
        completeObject[key] = await obj[key];
    }));

    return completeObject;

};
