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

const backupAndClearTables = Promise.coroutine(function* (tables: string[], t: test.Test): any {
    for (let i = 0; i < tables.length; i += 1) {
        let table = tables[i];
        yield dbSetup.backupTable(table);
        yield dbSetup.clearTable(table);
    }
    t.end();
}) as (tables: string[], t: test.Test) => Promise<void>;

const restoreTables = Promise.coroutine(function* (tables: string[], t: test.Test): any {
    for (let i = 0; i < tables.length; i += 1) {
        yield dbSetup.restoreTable(tables[i]);
    }
    t.end();
});

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

    before('Backing up `users`', (b: test.Test) => {
        backupAndClearTables(['users'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    t.test('Call with no arguments', (t: test.Test) => {
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
                Log.error(e);
                t.end();
            });
    });

    after('Restore `users` table', (a: test.Test) => {
        restoreTables(['users'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_2', (t: test.Test) => {
    let before = t.test;
    let after = t.test;

    before('Backup and clean `users`, `ixmBuyers`', (b: test.Test) => {
        backupAndClearTables(['users', 'ixmBuyers'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `ixmBuyers`', (a: test.Test) => {
        restoreTables(['users', 'ixmBuyers'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_3', (t: test.Test) => {
    let before = t.test;
    let after = t.test;

    before('Backup and clean `users`, `publishers`', (b: test.Test) => {
        backupAndClearTables(['users', 'publishers'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`', (a: test.Test) => {
        restoreTables(['users', 'publishers'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_4', (t: test.Test) => {
    let before = t.test;
    let after = t.test;

    before('Backup and clean `users`, `publishers`, `sites`', (b: test.Test) => {
        backupAndClearTables(['users', 'publishers', 'sites'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`', (a: test.Test) => {
        restoreTables(['users', 'publishers', 'sites'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_5', (t: test.Test) => {
    let before = t.test;
    let after = t.test;

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections, `rtbSiteSections`', (b: test.Test) => {
        backupAndClearTables(['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (a: test.Test) => {
        restoreTables(['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_6', (t: test.Test) => {
    let before = t.test;
    let after = t.test;

    before('Backup and clean `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (b: test.Test) => {
        backupAndClearTables(['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'], b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore `users`, `publishers`, `sites`, `rtbSections`, `rtbSiteSections`', (a: test.Test) => {
        restoreTables(['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections'], a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_7', (t: test.Test) => {
    let before = t.test;
    let after = t.test;
    let tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections',
    'ixmPackages', 'ixmPackageSectionMappings'];

    before('Backup and clean' + tables.toString(), (b: test.Test) => {
        backupAndClearTables(tables, b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore ' + tables.toString(), (a: test.Test) => {
        restoreTables(tables, a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

test('ATW_TF_DBPOP_8', (t: test.Test) => {
    let before = t.test;
    let after = t.test;
    let tables = ['users', 'publishers', 'sites', 'rtbSections', 'rtbSiteSections',
        'ixmPackages', 'ixmPackageSectionMappings'];

    before('Backup and clean' + tables.toString(), (b: test.Test) => {
        backupAndClearTables(tables, b)
            .catch((e) => {
                Log.error(e);
                b.end();
            });
    });

    after('Restore ' + tables.toString(), (a: test.Test) => {
        restoreTables(tables, a)
            .catch((e) => {
                Log.error(e);
                a.end();
            });
    });
    t.end();
});

after('Cleaning up after db-populator test..', (t: test.Test) => {
    app.shutdown();
    t.end();
});
