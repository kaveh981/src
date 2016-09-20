// Script to auto-populate Viper2 with data relevant to IXM Buyer API

import { DatabasePopulator } from '../helper/db-populator';
import { Logger }      from '../lib/logger';
import { ConfigLoader }      from '../lib/config-loader';
import { DatabaseManager } from '../lib/database-manager';

const Log= new Logger("TEST");
const Config = new ConfigLoader('../../../test/config');
const dbm = new DatabaseManager(Config);
const dbPopulator= new DatabasePopulator(dbm, Config);

let pubData: INewPubData;
let sites: INewSiteData[];

dbm.initialize()
    .then(() => {
        return dbPopulator.newPub();
    })
    .then((newPubData) => {
        pubData = newPubData;
        return dbPopulator.newSite(pubData.user.userID);
    })
    .then((newSiteData) => {
        sites = [newSiteData];
        return dbPopulator.newSite(pubData.user.userID);
    })
    .then((newSiteData) => {
        sites.push(newSiteData);
        let siteIDs = [sites[0].siteID, sites[1].siteID];
        return dbPopulator.newSection(pubData.user.userID, siteIDs);
    })
    .then((newSectionData) => {
        Log.info(`Created section ID: ${newSectionData.section.sectionID}, mapped to siteIDs: ${newSectionData.siteIDs}`);
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
