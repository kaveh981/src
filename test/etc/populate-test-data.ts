// Script to auto-populate Viper2 with data relevant to IXM Buyer API

import { DatabasePopulator } from '../helper/db-populator';
import { Logger }      from '../lib/logger';
import { ConfigLoader }      from '../lib/config-loader';
import { DatabaseManager } from '../lib/database-manager';

const Log= new Logger("TEST");
const Config = new ConfigLoader('../../../test/config');
const dbm = new DatabaseManager(Config);
const dbPopulator= new DatabasePopulator(dbm, Config);

dbm.initialize()
    .then(() => {
        return dbPopulator.newPub();
    })
    .then((newPubData) => {
        return dbPopulator.newSite(newPubData.user.userID);
    })
    .then(dbm.shutdown.bind(dbm))
    .catch((err) => {
        Log.error(err);
        dbm.shutdown();
<<<<<<< HEAD
    });
=======
    });
>>>>>>> Symlinks to api/src added
