/**
 * DatabasePopulator module test spec
 */
import * as test from 'tape';
import { Injector } from '../lib/injector';
import { DatabasePopulator } from '../helper/db-populator.helper';
import { DatabaseManager } from '../lib/database-manager';
import { Logger }      from '../lib/logger';
// import { boot, shutdown } from '../helper/loader.helper'

const Log = new Logger("TEST");
const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const dbManager = Injector.request<DatabaseManager>('DatabaseManager');

const before = test;
const after = test;

export default (suite: test.Test) => {
    test("Some test inside *.test file", (t: test.Test) => {
        dbPopulator.newUser()
            .then((newUserData) => {
                Log.debug(JSON.stringify(newUserData, undefined, 2));
                t.pass("User inserted to db");
                t.end();
            });
    });

    test("Wrapping up inside *.test file", (t: test.Test) => {
        suite.end();
        t.end();
    });
};


/*before("Boot Test Framework", (t: test.Test) => {
    
});

after("Shutdown Test Framework", (t: test.Test) => {
    shutdown();
    Log.debug('Test Framework shutdown..');
    t.end();
});*/

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
