/**
 * DatabasePopulator module test spec
 */
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
const before      = test;
const after       = test;

const backupTables = Promise.coroutine(function* (tables: string[]): any {
    for (let i = 0; i < tables.length; i += 1) {
        let table = tables[i];
        yield dbSetup.backupTable(table);
    }
}) as (tables: string[]) => Promise<void>;

const clearTables = Promise.coroutine(function* (tables: string[], t: test.Test): any {
    for (let i = 0; i < tables.length; i += 1) {
        let table = tables[i];
        yield dbSetup.clearTable(table);
    }
}) as (tables: string[]) => Promise<void>;

const restoreTables = Promise.coroutine(function* (tables: string[], t: test.Test): any {
    for (let i = 0; i < tables.length; i += 1) {
        yield dbSetup.restoreTable(tables[i]);
    }
}) as (tables: string[]) => Promise<void>;

before('Preparing for db-populator tests..', (b: test.Test) => {
    app.boot()
        .then(() => {
            b.end();
        })
        .catch((e) => {
            app.shutdown();
            throw e;
        });
});

test('ATW_TF_DBPOP_1', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables: string[] = ['users'];

    before('Backing up `users`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call "newUser()"', (t: test.Test) => {
        Promise.coroutine(function* () {
            let res1 = yield dbManager.from('users').count() as any;
            let previousCount: number = res1[0]['count(*)'];

            let newUser = yield dbPopulator.newUser();

            let res2 = yield dbManager.from('users').count() as any;
            let newCount: number = res2[0]['count(*)'];

            let newUserSelect = yield dbManager.select().from('users').orderBy('modifyDate', 'desc');
            let actualUser = newUserSelect[0];

            t.equal(newCount, previousCount + 1, '`users` count increased by 1');
            t.deepEqual(actualUser, newUser, 'Returned object is equal to new row in `users`');
            t.end();
        })()
            .catch((e) => {
                t.end();
                throw e;
            });
    });

    after('Restore `users` table', (a: test.Test) => {
        restoreTables(['users'])
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_2', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables: string[] = ['users', 'ixmBuyers'];

    before('Backup and clean `users`, `ixmBuyers`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call "newBuyer()"', (t: test.Test) => {
        Promise.coroutine(function* () {
            let res = yield dbManager.from('users').count() as any;
            let previousCount: number = res[0]['count(*)'];
            
            res = yield dbManager.from('users').count() as any;
            let buyerCount: number = res[0]['count(*)'];
            
            t.equal(buyerCount, 0, 'ixmBuyers count is 0');

            let newBuyer = yield dbPopulator.newBuyer();

            res = yield dbManager.from('users').count() as any;
            let newCount: number = res[0]['count(*)'];
            
            t.equal(newCount, previousCount + 1, '`users` count increased by 1');
            
            res = yield dbManager.from('ixmBuyers').count() as any;
            buyerCount = res[0]['count(*)'];
            
            t.equal(buyerCount, 1, 'ixmBuyers count is 1');

            let newUserSelect = yield dbManager.select().from('users').orderBy('modifyDate', 'desc');
            let actualUser = newUserSelect[0];

            let newIxmBuyerSelect = yield dbManager.select().from('ixmBuyers');
            let actualIxmBuyer = newIxmBuyerSelect[0];
            
            let newBuyerActual = {
                user: actualUser,
                dspID: actualIxmBuyer.dspID
            };

            t.equal(actualUser.userID, actualIxmBuyer.userID, 'Mapped correct userID');
            t.deepEqual(newBuyerActual, newBuyer, 'Returned NewBuyerData is equal to inserted data');
            t.end();
        })()
            .catch((e) => {
                t.end();
                throw e;
            });
    });

    after('Restore `users`, `ixmBuyers`', (a: test.Test) => {
        restoreTables(['users', 'ixmBuyers'])
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_3', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables: string[] = ['users', 'publishers'];

    before('Backup and clean `users`, `publishers`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`', (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

/*test('ATW_TF_DBPOP_4', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites'];

    before('Backup and clean `users`, `publishers`, `sites`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`', (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_5', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'];

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections, `rtbSiteSections`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_6', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'];

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
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
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore ' + tables.toString(), (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_8', (t: test.Test) => {
    const before = t.test;
    const after = t.test;
    const tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections',
        'ixmPackages', 'ixmPackageSectionMappings'];

    before('Backup and clean' + tables.toString(), (b: test.Test) => {
        backupTables(tables)
            .then(() => { return clearTables(tables) })
            .then(() => { b.end() })
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore ' + tables.toString(), (a: test.Test) => {
        restoreTables(tables)
            .then(() => { a.end() })
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});*/

after('Cleaning up after db-populator test..', (t: test.Test) => {
    app.shutdown();
    t.end();
});
