/**
 * DatabasePopulator module test spec
 */
'use strict';
import * as Promise from 'bluebird';
import * as test from 'tape';

import { DatabasePopulator } from '../helper/database-populator';
import { DatabaseManager   } from '../lib/database-manager';
import { DataSetup         } from '../helper/data-setup';
import { Injector          } from '../lib/injector';
import { Logger            } from '../lib/logger';
import { app               } from '../helper/bootstrap';

const Log         = new Logger('TEST');
const dbPopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const dbManager   = Injector.request<DatabaseManager>('DatabaseManager');
const dbSetup     = Injector.request<DataSetup>('DataSetup');
const TABLES      = ['users', 'ixmBuyers', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections', 'ixmPackages',
    'ixmPackageSectionMappings'];
const beforeAll   = test;
const afterAll    = test;

const backupTables = Promise.coroutine(function* (tables: string[]): any {
    for (let i = 0; i < tables.length; i += 1) {
        let table = tables[i];
        yield dbSetup.backupTable(table);
    }
}) as (tables: string[]) => Promise<void>;

const clearTables = Promise.coroutine(function* (tables: string[]): any {
    for (let i = 0; i < tables.length; i += 1) {
        let table = tables[i];
        yield dbSetup.clearTable(table);
    }
}) as (tables: string[]) => Promise<void>;

const restoreTables = Promise.coroutine(function* (tables: string[]): any {
    for (let i = 0; i < tables.length; i += 1) {
        yield dbSetup.restoreTable(tables[i]);
    }
}) as (tables: string[]) => Promise<void>;

beforeAll('Preparing for db-populator tests..', (b: test.Test) => {
    app.boot()
        .then(() => { return backupTables(TABLES); })
        .then(() => {
            Log.info(`Backed up tables: ${TABLES}`);
            b.end();
        })
        .catch((e) => {
            app.shutdown();
            throw e;
        });
});

test('ATW_TF_DBPOP_1', (t: test.Test) => {
    const before = t.test;
    const tables: string[] = ['users'];

    before('Backing up `users`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call "newUser()"', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let res1 = yield dbManager.from('users').count() as any;
            let previousCount: number = res1[0]['count(*)'];

            let newUser = yield dbPopulator.newUser();

            let res2 = yield dbManager.from('users').count() as any;
            let newCount: number = res2[0]['count(*)'];

            let newUserSelect = yield dbManager.select().from('users').orderBy('modifyDate', 'desc');
            let actualUser = newUserSelect[0];

            t0.equal(newCount, previousCount + 1, '`users` count increased by 1');
            t0.deepEqual(actualUser, newUser, 'Returned object is equal to new row in `users`');
            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_2', (t: test.Test) => {
    const before = t.test;
    const tables: string[] = ['users', 'ixmBuyers'];

    before('Backup and clean `users`, `ixmBuyers`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call "newBuyer()"', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let res = yield dbManager.from('users').count() as any;
            let previousCount: number = res[0]['count(*)'];

            res = yield dbManager.from('ixmBuyers').count() as any;
            let buyerCount: number = res[0]['count(*)'];

            t0.equal(buyerCount, 0, 'ixmBuyers count is 0');

            let newBuyer = yield dbPopulator.newBuyer();

            res = yield dbManager.from('users').count() as any;
            let newCount: number = res[0]['count(*)'];

            t0.equal(newCount, previousCount + 1, '`users` count increased by 1');

            res = yield dbManager.from('ixmBuyers').count() as any;
            buyerCount = res[0]['count(*)'];

            t0.equal(buyerCount, 1, 'ixmBuyers count is 1');

            let newUserSelect = yield dbManager.select().from('users').orderBy('modifyDate', 'desc');
            let actualUser = newUserSelect[0];

            let newIxmBuyerSelect = yield dbManager.select().from('ixmBuyers');
            let actualIxmBuyer = newIxmBuyerSelect[0];

            let newBuyerActual = {
                user: actualUser,
                dspID: actualIxmBuyer.dspID
            };

            t0.equal(actualUser.userID, actualIxmBuyer.userID, 'Mapped correct userID');
            t0.deepEqual(newBuyerActual, newBuyer, 'Returned NewBuyerData is equal to inserted data');
            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_3', (t: test.Test) => {
    const before = t.test;
    const tables: string[] = ['users', 'publishers'];

    before('Backup and clean `users`, `publishers`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call newPub()', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let res = yield dbManager.from('users').count() as any;
            let previousCount: number = res[0]['count(*)'];

            res = yield dbManager.from('publishers').count() as any;
            let publisherCount: number = res[0]['count(*)'];

            t0.equal(publisherCount, 0, '`publishers` count is 0');

            let newPublisher = yield dbPopulator.newPub();

            res = yield dbManager.from('users').count() as any;
            let newCount: number = res[0]['count(*)'];

            t0.equal(newCount, previousCount + 1, '`users` count increased by 1');

            res = yield dbManager.from('publishers').count() as any;
            publisherCount = res[0]['count(*)'];

            t0.equal(publisherCount, 1, '`publishers` count is 1');

            let newUserSelect = yield dbManager.select().from('users').orderBy('modifyDate', 'desc');
            let actualUser = newUserSelect[0];

            let newPublisherSelect = yield dbManager.select().from('publishers');
            let actualPublisher = newPublisherSelect[0];

            let newPublisherActual = {
                user: actualUser,
                publisher: actualPublisher
            };

            t0.equal(newPublisher.user.userID, actualPublisher.userID, 'Mapped correct userID');
            t0.deepEqual(newPublisherActual, newPublisher, 'Returned NewPubData is equal to inserted data');
            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_4', (t: test.Test) => {
    const before = t.test;
    const tables = ['users', 'publishers', 'sites'];

    before('Backup and clean `users`, `publishers`, `sites`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call newSite(someValidPublisherUserID))', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let newPublisher = yield dbPopulator.newPub();

            let res = yield dbManager.from('sites').count() as any;
            let count: number = res[0]['count(*)'];

            t0.equal(count, 0, '`sites` count is 0');

            let newSite = yield dbPopulator.newSite(newPublisher.user.userID);

            res = yield dbManager.from('sites').count() as any;
            count = res[0]['count(*)'];

            t0.equal(count, 1, '`sites` count is 1');

            let newSiteSelect = yield dbManager.select().from('sites').orderBy('modifyDate', 'desc');
            let actualSite = newSiteSelect[0];

            t0.deepEqual(actualSite, newSite, 'Returned NewSiteData is equal to inserted data');
            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_5', (t: test.Test) => {
    const before = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'];

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections, `rtbSiteSections`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call newSection(someValidPublisherUserID, someSiteIDOwnedBySaidPublisher))', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let newPublisher = yield dbPopulator.newPub();
            let newSite = yield dbPopulator.newSite(newPublisher.user.userID);

            let res = yield dbManager.from('rtbSections').count() as any;
            let count: number = res[0]['count(*)'];

            t0.equal(count, 0, '`rtbSections` count is 0');

            let newSection = yield dbPopulator.newSection(newPublisher.user.userID, [newSite.siteID]);

            res = yield dbManager.from('rtbSections').count() as any;
            count = res[0]['count(*)'];

            t0.equal(count, 1, '`rtbSections` count is 1');

            res = yield dbManager.from('rtbSiteSections').count() as any;
            count = res[0]['count(*)'];

            t0.equal(count, 1, '`rtbSiteSections` count is 1');

            let actualMapping: any[] = yield dbManager.select().from('rtbSiteSections');
            let newMapping = [{ sectionID: newSection.section.sectionID, siteID: newSection.siteIDs[0] }];

            t0.deepEqual(actualMapping, newMapping, 'Mapped correct siteID to new section in `rtbSiteSections`');

            let newSectionSelect: INewSectionData = yield dbManager.select().from('rtbSections');
            let actualSection = newSectionSelect[0];

            t0.deepEqual(actualSection, newSection.section, 'Returned NewSectionData is equal to inserted data');

            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_6', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'];

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call mapSection2Sites(someValidPublisherUserID, someSiteIDOwnedBySaidPublisher))', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let newPublisher = yield dbPopulator.newPub() as any;
            let newSite = yield dbPopulator.newSite(newPublisher.user.userID);
            let newSection = yield dbPopulator.newSection(newPublisher.user.userID, [newSite.siteID]);
            let newSite2 = yield dbPopulator.newSite(newPublisher.user.userID);
            let res = yield dbManager.from('rtbSiteSections').count() as any;
            let count = res[0]['count(*)'];

            t0.equal(count, 1, '`rtbSiteSections` count is 1');

            yield dbPopulator.mapSection2Sites(newSection.section.sectionID, [newSite2.siteID]);

            res = yield dbManager.from('rtbSiteSections').count() as any;
            count = res[0]['count(*)'];

            t0.equal(count, 2, '`rtbSiteSections` count is 2');

            let actualMapping = yield dbManager.select().from('rtbSiteSections');
            let newMapping = [
                { sectionID: newSection.section.sectionID, siteID: newSection.siteIDs[0] },
                { sectionID: newSection.section.sectionID, siteID: newSite2.siteID }
            ];

            t0.deepEqual(actualMapping, newMapping, 'Mapped an extra siteID to new section in `rtbSiteSections`');

            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_7', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections',
    'ixmPackages', 'ixmPackageSectionMappings'];

    before('Backup and clean' + tables.toString(), (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call newPackage(someValidPublisherUserID, someSectionIDOwnedBySaidPublisher))', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let newPublisher = yield dbPopulator.newPub() as any;
            let newSite      = yield dbPopulator.newSite(newPublisher.user.userID);
            let newSection   = yield dbPopulator.newSection(newPublisher.user.userID, [newSite.siteID]);
            let res          = yield dbManager.from('ixmPackages').count();
            let count        = res[0]['count(*)'];

            t0.equal(count, 0, '`ixmPackages` count is 0');

            let newPackage = yield dbPopulator.newPackage(newPublisher.user.userID, [newSection.section.sectionID]);

            res = yield dbManager.from('ixmPackages').count();
            count = res[0]['count(*)'];

            t0.equal(count, 1, 'ixmPackages` count is 1');

            let actualMapping: any[] = yield dbManager.select().from('ixmPackageSectionMappings');
            let newMapping = [{ sectionID: newPackage.sectionIDs[0], packageID: newPackage.package.packageID }];

            t0.deepEqual(actualMapping, newMapping, 'Correct sectionID to new package in `ixmPackageSectionMappings`');

            let newSelectPackage = yield dbManager.select().from('ixmPackages').orderBy('modifyDate', 'desc');
            let newPackageActual = newSelectPackage[0];

            t0.deepEqual(newPackageActual, newPackage.package, 'Returned NewSectionData is equal to inserted data');

            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

test('ATW_TF_DBPOP_8', (t: test.Test) => {
    const before = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections',
        'ixmPackages', 'ixmPackageSectionMappings'];

    before('Backup and clean' + tables.toString(), (b: test.Test) => {
        clearTables(tables)
            .then(() => { b.end(); })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call mapPackage2Section(publisherUserID, sectionID))', (t0: test.Test) => {
        Promise.coroutine(function* () {
            let newPublisher = yield dbPopulator.newPub() as any;
            let newSite      = yield dbPopulator.newSite(newPublisher.user.userID);
            let newSection   = yield dbPopulator.newSection(newPublisher.user.userID, [newSite.siteID]);
            let newSite2     = yield dbPopulator.newSite(newPublisher.user.userID);
            let newSection2  = yield dbPopulator.newSection(newPublisher.user.userID, [newSite2.siteID]);
            let newPackage   = yield dbPopulator.newPackage(newPublisher.user.userID, [newSection.section.sectionID]);
            let res          = yield dbManager.from('ixmPackageSectionMappings').count() as any;
            let count        = res[0]['count(*)'];

            t0.equal(count, 1, '`ixmPackageSectionMappings` count is 1');

            yield dbPopulator.mapPackage2Sections(newPackage.package.packageID, [newSection2.section.sectionID]);

            res = yield dbManager.from('ixmPackageSectionMappings').count() as any;
            count = res[0]['count(*)'];

            t0.equal(count, 2, '`ixmPackageSectionMappings` count is 2');

            let actualMapping = yield dbManager.select().from('ixmPackageSectionMappings');
            let newMapping = [
                { packageID: newPackage.package.packageID, sectionID: newSection.section.sectionID },
                { packageID: newPackage.package.packageID, sectionID: newSection2.section.sectionID }
            ];

            t0.deepEqual(actualMapping, newMapping, 'Mapped sectionID to new package in `rtbPackageSectionMappings`');

            t0.end();
        })()
            .catch((e) => {
                t0.end();
                throw e;
            });
    });

    t.end();
});

afterAll('Cleaning up after db-populator test..', (t: test.Test) => {
    restoreTables(TABLES)
        .then(() => {
            Log.info(`Restored tables: ${TABLES}`);
            app.shutdown();
            t.end();
        });
});
