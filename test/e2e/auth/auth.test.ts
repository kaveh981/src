'use strict';

import * as test from 'tape';
import * as express from 'express';
import * as Promise from 'bluebird';
import * as testFramework  from 'testFramework';

import { app      } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';
import { Test     } from 'tape';

const dataSetup = Injector.request<testFramework.IDataSetup>('DataSetup');

import { DatabasePopulator } from '../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import { ConfigLoader } from '../../lib/config-loader';
const config = Injector.request<ConfigLoader>('ConfigLoader');

function authTest(apiHelper: testFramework.IApiHelper): void {

    test('Auth Test', (t: Test) => {

        const tables: string[] = ['publishers', 'users', 'ixmBuyers'];
        let newBuyer: INewBuyerData;
        let newPub: INewPubData;
        let buyerIDKey: string = config.get('auth').header;

        t.test('setup', (assert: test.Test) => {
            Promise.coroutine(function* (): any {
                    yield app.boot();
                    for (let i = 0; i < tables.length; i += 1) {
                        let table = tables[i];
                        yield dataSetup.backupTable(table);
                        yield dataSetup.clearTable(table);
                    }
                    newBuyer = yield databasePopulator.newBuyer();
                    newPub = yield databasePopulator.newPub();
                })()
                .finally(() => {
                    assert.end();
                });
        });

         t.test('ATW_AUTH_1 when valid parameters passed in', (assert: Test) => {
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
            apiHelper.sendRequest()
                .then((res: any) => {
                    assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: ' + res.body.message);
                })
                .finally(() => {
                    assert.end();
                });
            apiHelper.setReqOpts({headers: {}});
        });

        t.test('ATW_AUTH_2 when buyerID in the header is not ixmBuyerID', (assert: Test) => {
            apiHelper.setReqOpts({headers: {[buyerIDKey]: '`' + newPub.user.userID }});
            apiHelper.sendRequest()
                .then((res: any) => {
                    assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
                })
                .finally(() => {
                    assert.end();
                });
            apiHelper.setReqOpts({headers: {}});
        });

        t.test('ATW_AUTH_3 when buyerID in the header is a non int', (assert: Test) => {
            apiHelper.setReqOpts({headers: {[buyerIDKey]: '`' + newBuyer.user.userID + '`'}});
            apiHelper.sendRequest()
                .then((res: any) => {
                    assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
                })
                .finally(() => {
                    assert.end();
                });
            apiHelper.setReqOpts({headers: {}});
        });

        t.test('ATW_AUTH_4 when buyerID not exists on the header', (assert: Test) => {
            apiHelper.sendRequest()
                .then((res: any) => {
                    assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
                })
                .finally(() => {
                    assert.end();
                });
        });

        t.test('teardown', (assert: test.Test) => {
            Promise.coroutine(function* (): any {
                for (let i = 0; i < tables.length; i += 1) {
                    let table = tables[i];
                    yield dataSetup.restoreTable(table);
                }
                app.shutdown();

            })()
            .finally(() => {
                assert.end();
            });
        });

    });
}

export { authTest }
