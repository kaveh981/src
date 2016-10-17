'use strict';

import * as test from 'tape';
import * as express from 'express';
import * as Promise from 'bluebird';
import * as testFramework  from 'testFramework';

import { app      } from '../../helper/bootstrap';
import { Injector } from '../../lib/injector';
import { Test     } from 'tape';
import { authTest } from '../auth/auth.test';

const apiHelper = Injector.request<testFramework.IApiHelper>('ApiHelper');

const helperMethods = Injector.request<testFramework.IHelperMethods>('HelperMethods');

const dataSetup = Injector.request<testFramework.IDataSetup>('DataSetup');

import { DatabasePopulator } from '../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import { ConfigLoader } from '../../lib/config-loader';
const config = Injector.request<ConfigLoader>('ConfigLoader');

import { DatabaseManager } from '../../lib/database-manager';
const dbm = Injector.request<DatabaseManager>('DatabaseManager');

apiHelper.setReqOpts({
    method: 'GET',
    path: '/ixm/deals'
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
    let newSection: INewSectionData;
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
                let newSite: INewSiteData = yield databasePopulator.newSite(newPub.user.userID);
                newSection = yield databasePopulator.newSection(newPub.user.userID, [newSite.siteID]);
                ixmPackage = yield databasePopulator.newPackage(newPub.user.userID, [newSection.section.sectionID],
                    {status: 'active'});
            })()
            .finally(() => {
                assert.end();
            });
    });

    t.test('ATW_D_GET_AUTH', (assert: Test) => {
        authTest(assert, apiHelper, newBuyer.user.userID);
        assert.end();
    });

    t.test('ATW_D_GET_V1 when limit is a non int', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'limit': `'10'`})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });

    t.test('ATW_D_GET_V2 when limit is int but less than 1', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'limit': -5})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });
    t.test('ATW_D_GET_V3 when limit is greater than 250 it has to be auto adjusted to 250', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'limit': 500})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: ' + res.body.message);
                assert.equal(res.body.pagination.limit, 250, 'Limit should be equal to 250');
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });
    t.test('ATW_D_GET_V4 when offset is a non int', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'offset': `'0'`})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });

    t.test('ATW_D_GET_V5 when offset is less than 0', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'offset': -1})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: ' + res.body.message);
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
    });

    t.test('ATW_D_GET_V6 when valid parameters passed in', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: ' + res.body.message);
                assert.deepEquals(res.body.data[0], toPayload([ixmPackage.package], newPub, newSection),
                    'The response object should match mock response object');
            })
            .finally(() => {
                assert.end();
            });
        apiHelper.setReqOpts({headers: {}});
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

    /**
     * Reformat the package object as is in the expected response based on API spec
     * @param [packages] Array<INewPackageData> - Array of INewPackageData object
     * @param contact INewPubData - publisher contact info
     * @param newSection INewSection - a new site section object
     * @returns expected api response
     */
    function toPayload(packages, contact: INewPubData, createdSection): {} {
        return  packages.map((pack) => {
            return {
                id: pack.packageID,
                publisher_id: pack.ownerID,
                contact: {
                    title: 'Warlord',
                    name: contact.user.firstName + ' ' + contact.user.lastName,
                    email_address: contact.user.emailAddress,
                    phone: contact.user.phone
                },
                name: pack.name,
                status: pack.status,
                currency: 'USD',
                description: pack.description,
                start_date: helperMethods.dateToYMD(pack.startDate.toISOString()),
                end_date: helperMethods.dateToYMD(pack.endDate.toISOString()),
                price: pack.price,
                impressions: pack.impressions,
                budget: pack.budget,
                auction_type: pack.auctionType,
                terms: pack.terms,
                created_at: pack.createDate.toISOString(),
                modified_at: pack.modifyDate.toISOString(),
                deal_section_id: [createdSection.section.sectionID]
            };
        })[0];
    }

});
