// Script to auto-populate Viper2 with data relevant to IXM Buyer API

import { DatabasePopulator } from '../helper/db-populator';
import { Logger } from '../../lib/logger';
import { ConfigLoader } from '../../lib/config-loader';
import { DatabaseManager } from '../../lib/database-manager';

const Config = new ConfigLoader('../test/config');
const logger = new Logger("TEST");
const dbm = new DatabaseManager(Config);
const dbPopulator = new DatabasePopulator(dbm, Config);

dbPopulator.initialize()
    .then(() => {
        return dbPopulator.newPub();
    })
    .then(dbPopulator.shutdown.bind(dbPopulator))
    .catch((err) => {
        logger.error(err);
        dbPopulator.shutdown();
    });
