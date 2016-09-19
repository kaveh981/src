// Script to auto-populate Viper2 with data relevant to IXM Buyer API

import { DatabasePopulator } from '../helper/db-populator';
import { Logger }      from '../../api/src/lib/logger';
import { ConfigLoader }      from '../../api/src/lib/config-loader';
import { DatabaseManager } from '../../api/src/lib/database-manager';

const Log= new Logger("TEST");
const Config = new ConfigLoader('../test/config');
const dbm = new DatabaseManager(Config);
const dbPopulator= new DatabasePopulator(dbm, Config);

dbPopulator.initialize()
    .then(() => {
        return dbPopulator.newPub();
    })
    .then(dbPopulator.shutdown.bind(dbPopulator))
    .catch((err) => {
        Log.error(err);
        dbPopulator.shutdown();
    });