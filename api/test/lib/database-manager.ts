'use strict';

import * as test from 'tape';
import * as Promise from 'bluebird';

import { DatabaseManager } from '../../src/lib/database-manager';

test('Database Selection Test', (assert: test.Test) => {
    assert.plan(1);

    DatabaseManager.initialize()
            .then(() => {
                return DatabaseManager.select().from('users').limit(1)
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
                DatabaseManager.shutdown();
            });

});
