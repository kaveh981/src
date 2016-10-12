'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';
import * as testFramework  from 'testFramework';

import { app      } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';
import { Test     } from 'tape';

const dataSetup = Injector.request<testFramework.IDataSetup>('DataSetup');

import { ConfigLoader } from '../../lib/config-loader';
const config = Injector.request<ConfigLoader>('ConfigLoader');

import { DatabasePopulator } from '../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

/**
 * Reusable Test for buyer authentication 
 * @param {Test} t
 * @param {testFramework.IApiHelper} apiHelper
 * @param {number} newBuyerID
 */
function authTest(t: Test, apiHelper: testFramework.IApiHelper, newBuyerID: number): void {

    const tables: string[] = ['publishers', 'users'];
    let newPub: INewPubData;
    let buyerIDKey: string = config.get('auth').header;

    t.test('setup', (assert: Test) => {
        Promise.coroutine(function* (): any {
                for (let i = 0; i < tables.length; i += 1) {
                    let table = tables[i];
                    yield dataSetup.backupTable(table, '_backup_auth');
                }
                newPub = yield databasePopulator.newPub();
            })()
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_AUTH_V1 when valid parameters passed in', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyerID}});

        apiHelper.sendRequest()
        .then((res: any) => {
            t.ok(res.httpStatusCode === 200 || res.httpStatusCode === 400,
                'It should return status code 200, returned message is: ' + res.body.message);

        })
        .finally(() => {
            assert.end();
        });
        apiHelper.setReqOpts({headers: {}});
    });
    t.test('ATW_AUTH_V2 when buyerID in the header is not ixmBuyerID', (assert: Test) => {

        apiHelper.setReqOpts({headers: {[buyerIDKey]: + newPub.user.userID }});
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });

    t.test('ATW_AUTH_V3 when buyerID in the header is a non int', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: '`' + newBuyerID + '`'}});
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });

    t.test('ATW_AUTH_V4 when buyerID not exists on the header', (assert: Test) => {
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
    });

    t.test('teardown', (assert: Test) => {
        Promise.coroutine(function* (): any {
            for (let i = 0; i < tables.length; i += 1) {
                let table = tables[i];
                yield dataSetup.restoreTable(table, '_backup_auth');
            }
        })()
            .finally(() => {
                assert.end();
            });
    });

}

export { authTest }
