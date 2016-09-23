/**
 * DatabasePopulator module test spec
 */

import * as test from 'tape';

import { app } from '../helper/loader.helper'
import { Injector } from '../lib/injector';
import { DatabasePopulator } from '../helper/db-populator.helper';
import { DatabaseManager } from '../lib/database-manager';
import { Logger }      from '../lib/logger';


const Log         = new Logger("TEST");
const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const dbManager   = Injector.request<DatabaseManager>('DatabaseManager');
const before      = test;
const after       = test;

before("Preparing for db-populator tests..", (t: test.Test) => {
    app.boot()
        .then(() => {
            t.end();
        })
        .catch((e) => {
            app.shutdown();
            throw e;
        });
});

test("Some test inside *.test file", (t:test.Test) => {
    dbPopulator.newUser()
        .then((newUserData) => {
            Log.debug(JSON.stringify(newUserData, undefined, 2));
            t.pass("User inserted to db");
            t.end();
        });
});

test("should extend schema properly", (t: test.Test) => {
    dbPopulator.newBuyer()
        .then((newBuyerData) => {
            Log.debug(JSON.stringify(newBuyerData, undefined, 4));
            t.end();
        });
});

after("Cleaning up after db-populator test..", (t:test.Test) => {
    app.shutdown();
    t.end();
});

/*
boot()
    .then(() => {
        test("DB Populator Test Spec", (assert: test.Test) => {
            let pubData: INewPubData;
            let sites: INewSiteData[];
            let sections: INewSectionData[];

            return dbPopulator.newPub()
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
                    Log.info(`Created section ID: ${newSectionData.section.sectionID}, mapped to siteIDs: ${newSectionData.siteIDs}`);
                    return dbPopulator.newPackage(pubData.user.userID, sectionIDs);
                })
                .then((newPackageData) => {
                    Log.info("Created package ID: " + newPackageData.packageID + ", mapped to sectionIDs: " + newPackageData.sectionIDs)
                })
                .then(shutdown)
                .catch((err) => {
                    Log.error(err);
                    shutdown();
                });
        });
    })
    .finally(shutdown)
    .catch((e) => {
        Log.error(e);
        shutdown();
    });*/
