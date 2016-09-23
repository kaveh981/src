/**
 * DatabasePopulator module test spec
 */
import * as test from 'tape';

import { DatabasePopulator } from '../helper/db-populator.helper';
import { DatabaseManager   } from '../lib/database-manager';
import { Injector          } from '../lib/injector';
import { Logger            } from '../lib/logger';
import { app               } from '../helper/loader.helper';

const Log         = new Logger('TEST');
const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const dbManager   = Injector.request<DatabaseManager>('DatabaseManager');
const before      = test;
const after       = test;

let pubData: INewPubData;
let sites: INewSiteData[];
let sections: INewSectionData[];

before('Preparing for db-populator tests..', (t: test.Test) => {
    app.boot()
        .then(() => {
            t.end();
        })
        .catch((e) => {
            app.shutdown();
            throw e;
        });
});

test('Create a User entity', (t: test.Test) => {
    dbPopulator.newUser()
        .then((newUserData) => {
            t.pass('- User inserted to db');
            t.end();
        })
        .catch((e) => {
            throw e;
        });
});

test('Create a Buyer entity', (t: test.Test) => {
    dbPopulator.newBuyer()
        .then((newBuyerData) => {
            t.pass('- Buyer inserted to db');
            t.end();
        })
        .catch((e) => {
            throw e;
        });
});

test('Create a Publisher entity', (t: test.Test) => {
    dbPopulator.newPub()
        .then((newPubData) => {
            pubData = newPubData;
            t.pass('- Publisher inserted to db');
            t.end();
        })
        .catch((e) => {
            throw e;
        });
});

test('Create a Site entity', (t: test.Test) => {
    dbPopulator.newSite(pubData.user.userID)
        .then((newSiteData) => {
            sites = [newSiteData];
            return dbPopulator.newSite(pubData.user.userID);
        })
        .then((newSiteData) => {
            sites.push(newSiteData);
            t.pass('- 2 Sites inserted to db');
            t.end();
        })
        .catch((e) => {
            throw e;
        });
});

test('Create a Section entity', (t: test.Test) => {
    let siteIDs = [sites[0].siteID, sites[1].siteID];
    dbPopulator.newSection(pubData.user.userID, siteIDs)
        .then((newSectionData) => {
            sections = [newSectionData];
            return dbPopulator.newSection(pubData.user.userID, [sites[0].siteID]);
        })
        .then((newSectionData) => {
            sections.push(newSectionData);
            t.pass('- 2 sections inserted to db');
            t.end();
        })
        .catch((e) => {
            throw e;
        });
});

test('Create a Package entity', (t: test.Test) => {
    let sectionIDs = [sections[0].sectionID, sections[1].sectionID];
    dbPopulator.newPackage(pubData.user.userID, sectionIDs)
        .then((newPackageData) => {
            t.pass('A Package was inserted to db');
            t.end();
        })
        .catch((e) => {
            t.end();
            throw(e);
        });
});

after('Cleaning up after db-populator test..', (t: test.Test) => {
    app.shutdown();
    t.end();
});
