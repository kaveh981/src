// Script to auto-populate Viper2 with data relevant to IXM Buyer API



import { ConfigLoader }      from '../lib/config-loader';
import { Injector } from '../lib/injector';

const Config = new ConfigLoader('../../../test/config');
Injector.put(Config, "ConfigLoader");

import { Logger }      from '../lib/logger';
const Log = new Logger("TEST");

import { DatabasePopulator } from '../helper/db-populator';
import { DatabaseManager } from '../lib/database-manager';

const dbm = new DatabaseManager(Config);
const dbPopulator= new DatabasePopulator(dbm, Config);

let pubData: INewPubData;
let sites: INewSiteData[];
let sections: INewSectionData[];

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
        sections = [newSectionData];
        return dbPopulator.newSection(pubData.user.userID, [sites[0].siteID])
    })
    .then((newSectionData) => {
        sections.push(newSectionData);
        let sectionIDs: number[] = [];
        sections.map((section) => {
            sectionIDs.push(section.section.sectionID);
        });
        return dbPopulator.newPackage(pubData.user.userID, sectionIDs);
    })
    .then((newPackageData) => {
        Log.info("Created package ID: " + newPackageData.packageID + ", mapped to sectionIDs: " + newPackageData.sectionIDs)
    })
    .then(dbm.shutdown.bind(dbm))
    .catch((err) => {
        Log.error(err);
        dbm.shutdown();
    });