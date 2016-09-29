'use strict';

import * as test from 'tape';
import * as express from 'express';
import * as Promise from 'bluebird';

import { app      } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';
import { Test     } from 'tape';

import { ApiHelper } from '../../helper/api-helper';
const apiHelper = Injector.request<ApiHelper>('ApiHelper');

import { DataSetup } from '../../helper/data-setup';
const dataSetup = Injector.request<DataSetup>('DataSetup');

import { DatabasePopulator } from '../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import { DatabaseManager } from '../../lib/database-manager';
const dbm = Injector.request<DatabaseManager>('DatabaseManager');

apiHelper.setOptions({
    method: 'GET',
    path: '/deals'
});

test('/deals GET', (t: Test) => {
    const tables: string[] = ['ixmPackageSectionMappings',
        'ixmPackages',
        'rtbSiteSections',
        'rtbSections',
        'sites',
        'publishers',
        'users',
        'ixmBuyers'];
    let ixmPackage: INewPackageData;
    let newBuyer: INewBuyerData;
    let newPub: INewPubData;
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
            let newSite: INewSiteData = yield databasePopulator.newSite(newPub.user.userID);
            let newSection: INewSectionData = yield databasePopulator.newSection(newPub.user.userID, [newSite.siteID]);
            ixmPackage = yield databasePopulator.newPackage(newPub.user.userID, [newSection.section.sectionID]);
        })()
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_V1 when limit is a non int', (assert: Test) => {
        apiHelper.sendRequest({'limit': `'10'`})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400');
            })
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_V2 when limit is int but less than 1', (assert: Test) => {
        apiHelper.sendRequest({'limit': -5})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400');
            })
            .finally(() => {
                assert.end();
            });
    });
    t.test('ATW_D_GET_V3 when limit is greater than 250 it has to be auto adjusted to 250', (assert: Test) => {
        apiHelper.sendRequest({'limit': 500})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200');
                assert.equal(res.body.pagination.limit, 250, 'Limit should be equal to 250');
            })
            .finally(() => {
                assert.end();
            });
    });
    t.test('ATW_D_GET_V4 when offset is a non int', (assert: Test) => {
        apiHelper.sendRequest({'offset': `'0'`})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400');
            })
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_V5 when offset is less than 0', (assert: Test) => {
        apiHelper.sendRequest({'offset': -1})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400');
            })
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_V7 when buyerID in the header is a non int', (assert: Test) => {
        apiHelper.setBuyerUserID( newBuyer.user.userID.toString());
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401');
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.clearBuyerUserID();
    });

    t.test('ATW_D_GET_V8 when valid parameters passed in', (assert: Test) => {
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200');
             //   assert.equal(res.body.data.packages[0], ixmPackage.package, 'It should return status code 200');
            })
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_V7 when buyerID is not a know IXM-buyer', (assert: Test) => {
        apiHelper.setBuyerUserID(newPub.user.userID + 5);
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401');
            })
            .finally(() => {
                    assert.end();
            });
        apiHelper.clearBuyerUserID();
    });

    t.test('ATW_D_GET_V10 when buyerID is not a know IXM-buyer but the userID exist in the users table for another user type',
        (assert: Test) => {
        apiHelper.setBuyerUserID(newPub.user.userID);
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 401, 'It should return status code 401');
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.clearBuyerUserID();
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
