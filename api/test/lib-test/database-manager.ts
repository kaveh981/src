'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { ConfigLoader } from '../../src/lib/config-loader';

const config = new ConfigLoader('../../');
Injector.put(config, 'ConfigLoader');

import { DatabaseManager } from '../../src/lib/database-manager';

config.initialize()
    .then(() => {
    /**
     * Unit test of database manager initialization
     */
        test('Database Selection Test', (assert: test.Test) => {
            const databaseManager = new DatabaseManager(config);
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
    /**
     *  Unit test of SQL generation with filters, tests each additional filter pairwise
     */

        test('Database Filtering Test', (assert: test.Test) => {
            const databaseManager = new DatabaseManager(config);

            let desiredFilters = { owner_id: 100001 };

            let desiredFilterMapping = {
                owner_id: {
                    table: 'ixmDealProposals',
                    operator: '=',
                    column: 'ownerID'
                }
            };

            assert.plan(Math.pow(Object.keys(desiredFilters).length, 2));

            databaseManager.initialize()
                .then(() => {
                    for (let filterName1 in desiredFilters) {
                        for (let filterName2 in desiredFilters) {
                            let testFilters: any;
                            let testMappings: any;
                            let expectedQuery: string;

                            if (filterName1 === filterName2) {

                                testFilters = { [filterName1]: desiredFilters[filterName1] };
                                testMappings = { [filterName1]: desiredFilterMapping[filterName1] };
                                let expectedFilterParam1: any;

                                expectedFilterParam1 = desiredFilters[filterName1];

                                if (typeof expectedFilterParam1 === 'string') {
                                    expectedFilterParam1 = `'` + expectedFilterParam1 + `'`;
                                }

                                expectedQuery = 'select * where (`' + desiredFilterMapping[filterName1]['table'] +  '`.`' +
                                                 desiredFilterMapping[filterName1]['column'] + '` ' +
                                                 desiredFilterMapping[filterName1]['operator'] + ' ' + expectedFilterParam1 + ')';

                            } else {

                                testFilters = { [filterName1]: desiredFilters[filterName1], [filterName2]: desiredFilters[filterName2] };
                                testMappings = { [filterName1]: desiredFilterMapping[filterName1], [filterName2]: desiredFilterMapping[filterName2] };
                                let expectedFilterParam1: any;
                                let expectedFilterParam2: any;

                                expectedFilterParam1 = desiredFilters[filterName1];
                                expectedFilterParam2 = desiredFilters[filterName2];

                                if (typeof expectedFilterParam1 === 'string') {
                                    expectedFilterParam1 = `'` + expectedFilterParam1 + `'`;
                                }

                                if (typeof expectedFilterParam2 === 'string') {
                                    expectedFilterParam2 = `'` + expectedFilterParam2 + `'`;
                                }

                                expectedQuery = 'select * where (`' + desiredFilterMapping[filterName1]['table'] +  '`.`' +
                                                desiredFilterMapping[filterName1]['column'] + '` ' + desiredFilterMapping[filterName1]['operator'] +
                                                ' ' + expectedFilterParam1 + ' and `' + desiredFilterMapping[filterName2]['table'] + '`.`' +
                                                desiredFilterMapping[filterName2]['column'] + '` ' +
                                                desiredFilterMapping[filterName2]['operator'] + ' ' + expectedFilterParam2 + ')';

                            }

                            let dbFilter = databaseManager.createFilter(testFilters, testMappings);
                            let query = databaseManager.where(dbFilter).toString();

                            assert.equal(query, expectedQuery);
                        }
                    }
                })
                .finally(() => {
                    databaseManager.shutdown();
                });
        });
});
