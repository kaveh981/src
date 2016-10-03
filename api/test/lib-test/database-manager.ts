'use strict';

import * as test from 'tape';
import * as Promise from 'bluebird';

import { Injector } from '../../src/lib/injector';
import { ConfigLoader } from '../../src/lib/config-loader';

const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

import { DatabaseManager } from '../../src/lib/database-manager';

const databaseManager = new DatabaseManager(config);

/**
 * Unit test of database manager initialization
 */
test('Database Selection Test', (assert: test.Test) => {
    assert.plan(1);

    databaseManager.initialize()
            .then(() => {
                return databaseManager.select().from('users').limit(1)
                    .then((rows: any) => {
                        assert.equal(rows.length, 1, 'Selected one user from the users table.');
                    })
                    .catch((err: Error) => {
                        assert.fail('User selection failed ' + err);
                    });
            })
            .catch((err: Error) => {
                assert.fail('Database failed with error: ' + err);
            })
            .finally(() => {
                databaseManager.shutdown();
            });

});
