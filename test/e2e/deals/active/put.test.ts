'use strict';

import * as test from 'tape';
import * as Promise from 'bluebird';
import * as testFramework  from 'testFramework';

import { app      } from '../../../helper/bootstrap';
import { Injector } from '../../../lib/injector';
import { Test     } from 'tape';
import { authTest } from '../../auth/auth.test';

const apiHelper = Injector.request<testFramework.IApiHelper>('ApiHelper');

const helperMethods = Injector.request<testFramework.IHelperMethods>('HelperMethods');

const dataSetup = Injector.request<testFramework.IDataSetup>('DataSetup');

import { DatabasePopulator } from '../../../helper/database-populator';
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

import { ConfigLoader } from '../../../lib/config-loader';
const config = Injector.request<ConfigLoader>('ConfigLoader');

import { DatabaseManager } from '../../../lib/database-manager';
const dbm: DatabaseManager = Injector.request<DatabaseManager>('DatabaseManager');

apiHelper.setReqOpts({
    method: 'PUT',
    path: '/ixm/deals/active'
});
apiHelper.setIsQueryString(false);

test('/deals/active PUT', (t: Test) => {
    const tables: string[] = [
        'rtbDSPs',
        'rtbDeals',
        'ixmProposalSectionMappings',
        'ixmDealNegotiations',
        'ixmNegotiationDealMappings',
        'rtbDealSections',
        'ixmDealProposals',
        'rtbSiteSections',
        'rtbSections',
        'sites',
        'publishers',
        'users',
        'ixmBuyers'
    ];

    let ixmProposal: INewProposalData;
    let newBuyer: INewBuyerData;
    let newBuyer2: INewBuyerData;
    let newBuyerDifferentDSP: INewBuyerData;
    let newPub: INewPubData;
    let newSection: INewSectionData;
    let newSection2: INewSectionData;
    let newSite: INewSiteData;
    let newSite2: INewSiteData;
    let newDSP: INewDSPData;
    let buyerIDKey: string = config.get('auth').header;

    t.test('setup', (assert: test.Test) => {
        Promise.coroutine(function* (): any {
                yield app.boot();
                for (let i = 0; i < tables.length; i += 1) {
                    let table = tables[i];
                    yield dataSetup.backupTable(table);
                    yield dataSetup.clearTable(table);
                }
                yield databasePopulator.newDSP(1);
                newDSP = yield databasePopulator.newDSP(2);
                newBuyer = yield databasePopulator.newBuyer();
                newBuyer2 = yield databasePopulator.newBuyer();
                newBuyerDifferentDSP = yield databasePopulator.newBuyer();
                newPub = yield databasePopulator.newPub();
                newSite = yield databasePopulator.newSite(newPub.user.userID);
                newSite2 = yield databasePopulator.newSite(newPub.user.userID);
                newSection = yield databasePopulator.newSection(newPub.user.userID, [newSite.siteID, newSite2.siteID]);
                newSection2 = yield databasePopulator.newSection(newPub.user.userID, [newSite.siteID]);
                ixmProposal = yield databasePopulator.newProposal(newPub.user.userID,
                    [newSection.section.sectionID, newSection2.section.sectionID], {status: 'active'});
            })()
            .catch((e) => {
                console.error(e);
                assert.end();
            })
            .finally(() => {
                assert.end();
            });

    });

    t.test('ATW_D_GET_AUTH', (assert: Test) => {
        authTest(assert, apiHelper, newBuyer.user.userID);
        assert.end();
    });

    t.test(' ATW_DA_PUT_V1 when valid parameters passed in', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID }});
        apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                assert.deepEquals(res.body.data[0], toPayload(
                    [ixmProposal.proposal],
                    newPub,
                    [newSection.section.sectionID, newSection2.section.sectionID],
                    res.body.data[0].id,
                    res.body.data[0].external_id,
                    newBuyer.dspID),
                    'The response object should match mock response object');
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });
    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V2 when proposalID is not provided', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest()
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V3 when proposalID contains letters', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'proposalID': '`ixm' + ixmProposal.proposal.proposalID + '`'})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V4 when proposalID is negative', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'proposalID': - ixmProposal.proposal.proposalID })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V5 when proposalID is 0', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'proposalID': 0})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V6 when proposalID is max range', (assert: Test) => {
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                proposalID: 16777215
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': 16777215});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', 16777215)
                    .update({
                        proposalID: ixmProposal.proposal.proposalID
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });
    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V7 when proposalID is max range + 1', (assert: Test) => {
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                proposalID: 16777215
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': 16777215 + 1});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', 16777215)
                    .update({
                        proposalID: ixmProposal.proposal.proposalID
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });
    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V8 when proposalID is not int', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'proposalID': '`' + ixmProposal.proposal.proposalID + '`'})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 400, 'It should return status code 400, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V9 when proposalID does not exist', (assert: Test) => {
        apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
        apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID + 5})
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 404, 'It should return status code 404, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V10 when proposal is paused', (assert: Test) => {

        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                status: 'paused'
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        status: ixmProposal.proposal.status
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V_PACKAGE_V11 when	proposal is deleted', (assert: Test) => {

        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                status: 'deleted'
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID });
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 404, 'It should return status code 404, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        status: ixmProposal.proposal.status
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });
    });

    t.test(' ATW_DA_PUT_V12 when proposal is expired', (assert: Test) => {
        let currentDate: Date = new Date();
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                endDate: helperMethods.dateToYMD(currentDate.setDate(currentDate.getDate() - 5))
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID });
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        endDate:  ixmProposal.proposal.endDate
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V13 when proposal expires today', (assert: Test) => {
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                endDate: helperMethods.dateToYMD( new Date())
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID });
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        endDate:  ixmProposal.proposal.endDate
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V14 when proposal has not started yet', (assert: Test) => {
        let currentDate: Date = new Date();
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                startDate: helperMethods.dateToYMD(currentDate.setDate(currentDate.getDate() + 5))
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID });
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);

            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        startDate: ixmProposal.proposal.startDate
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V15 when proposal starts today', (assert: Test) => {
        dbm.from('ixmDealProposals')
            .where('proposalID', ixmProposal.proposal.proposalID)
            .update({
                startDate: helperMethods.dateToYMD(new Date())
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': + ixmProposal.proposal.proposalID });
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);

            })
            .then(() => {
                return dbm.from('ixmDealProposals')
                    .where('proposalID', ixmProposal.proposal.proposalID)
                    .update({
                        startDate: ixmProposal.proposal.startDate
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V16 when proposal already bought by a buyer from different DSP',
        (assert: Test) => {
            let response: any = {};
            dbm.from('ixmBuyers')
                .where('userID', newBuyerDifferentDSP.user.userID)
                .update({
                    dspID: 2
                })
                .then(() => {
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyerDifferentDSP.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((res: any) => {
                    response = res;
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });
    t.test(' ATW_DA_PUT_V17 when proposal already bought by same buyer',
        (assert: Test) => {
            let response: any = {};
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
            apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
                .then((res: any) => {
                    response = res;
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 403 , 'It should return status code 403, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });

    t.test(' ATW_DA_PUT_V18 when Proposal proposal already bought by a buyer from same DSP',
        (assert: Test) => {
            let response: any = {};
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer2.user.userID}});
            apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
                .then((res: any) => {
                    response = res;
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });

    t.test(' ATW_DA_PUT_V19 when proposal already bought by same buyer, but deal now disabled',
        (assert: Test) => {
            let response: any = {};
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
            apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
                .then((res) => {
                    response = res;
                    return dbm.from('rtbDeals')
                        .join('ixmNegotiationDealMappings', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                        .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID', 'ixmNegotiationDealMappings.negotiationID')
                        .where('proposalID', ixmProposal.proposal.proposalID)
                        .andWhere('buyerId', newBuyer.user.userID)
                        .update({
                            status: 'D'
                        });
                })
                .then((res: any) => {
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });

    t.test(' ATW_DA_PUT_V20 when proposal already bought by same buyer, deal is status new',
        (assert: Test) => {
            let response: any = {};
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
            apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
                .then((res) => {
                    response = res;
                    return dbm.from('rtbDeals')
                        .join('ixmNegotiationDealMappings', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                        .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID', 'ixmNegotiationDealMappings.negotiationID')
                        .where('proposalID', ixmProposal.proposal.proposalID)
                        .andWhere('buyerId', newBuyer.user.userID)
                        .update({
                            status: 'N'
                        });
                })
                .then((res: any) => {
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });

    t.test(' ATW_DA_PUT_V21 when proposal already bought by same buyer, but deal now paused',
        (assert: Test) => {
            let response: any = {};
            apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
            apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID})
                .then((res) => {
                    response = res;
                    dbm.from('rtbDeals')
                        .whereIn('dealID', function() {
                            this.select('dealID')
                                .from('ixmNegotiationDealMappings')
                                .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID',
                                        'ixmNegotiationDealMappings.negotiationID')
                                .where('proposalID', ixmProposal.proposal.proposalID)
                                .andWhere('buyerID', newBuyer.user.userID);
                        })
                        .update({
                            status: 'P'
                        });
                })
                .then((res: any) => {
                    apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                    return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
                })
                .then((secRes: any) => {
                    assert.equal(secRes.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                        + secRes.body.message + ' ' + JSON.stringify(secRes.body));
                    return afterAPICall(secRes);
                })
                .then(() => {
                    return afterAPICall(response);
                })
                .finally(() => {
                    assert.end();
                    apiHelper.setReqOpts({headers: {}});
                });

        });

    t.test(' ATW_DA_PUT_V22 when some sections are no longer active', (assert: Test) => {
        dbm.from('rtbSections')
            .where('sectionID', newSection2.section.sectionID)
            .update({
                status: 'D'
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('rtbSections')
                    .where('sectionID', newSection2.section.sectionID)
                    .update({
                        status: newSection2.section.status
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V23 when no active sections are available', (assert: Test) => {
        dbm.from('rtbSections')
            .where('sectionID', newSection.section.sectionID)
            .update({
                status: 'D'
            })
            .then(() => {
                return dbm.from('rtbSections')
                    .where('sectionID', newSection2.section.sectionID)
                    .update({
                        status: 'D'
                    });
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('rtbSections')
                    .where('sectionID', newSection.section.sectionID)
                    .update({
                        status: newSection.section.status
                    });
            })
            .then(() => {
                return dbm.from('rtbSections')
                    .where('sectionID', newSection2.section.sectionID)
                    .update({
                        status: newSection2.section.status
                    });
            })
            .finally(() => {
                assert.end();
            });

    });

    t.test(' ATW_DA_PUT_V24 when some sites are no longer active', (assert: Test) => {
        dbm.from('sites')
            .where('siteID', newSite2.siteID)
            .update({
                status: 'D'
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 200, 'It should return status code 200, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('sites')
                    .where('siteID', newSite2.siteID)
                    .update({
                        status: newSite2.status
                    });
            })
            .finally(() => {
                assert.end();
                apiHelper.setReqOpts({headers: {}});
            });

    });

    t.test(' ATW_DA_PUT_V25 when no active site remains', (assert: Test) => {
        dbm.from('sites')
            .where('siteID', newSite.siteID)
            .update({
                status: 'D'
            })
            .then(() => {
                return dbm.from('sites')
                    .where('siteID', newSite2.siteID)
                    .update({
                        status: 'D'
                    });
            })
            .then(() => {
                apiHelper.setReqOpts({headers: {[buyerIDKey]: newBuyer.user.userID}});
                return apiHelper.sendRequest({'proposalID': ixmProposal.proposal.proposalID});
            })
            .then((res: any) => {
                assert.equal(res.httpStatusCode, 403, 'It should return status code 403, returned message is: '
                    + res.body.message + ' ' + JSON.stringify(res.body));
                return afterAPICall(res);
            })
            .then(() => {
                return dbm.from('sites')
                    .where('siteID', newSite.siteID)
                    .update({
                        status: newSite.status
                    });
            })
            .then(() => {
                return dbm.from('sites')
                    .where('siteID', newSite2.siteID)
                    .update({
                        status: newSite2.status
                    });
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

    /**
     * Reformat the proposal object as is in the expected response based on API spec
     * @param [proposals] Array<INewProposalData> - Array of INewProposalData object
     * @param contact INewPubData - publisher contact info
     * @param [newSections] INewSection - an array of new site sections object
     * @param dealID Number - dealID of generated deal
     * @param externalDealID string - externalDealID of generated deal
     * @param dspID number - dspID of created buyer
     * @returns expected api response
     */
    function toPayload(proposals, contact, createdSections: number[], dealID, externalDealID, dspID): {} {
        return  proposals.map((pack) => {
            return {
                id: dealID,
                publisher_id: pack.ownerID,
                contact: {
                    title: 'Warlord',
                    name: contact.user.firstName + ' ' + contact.user.lastName,
                    email: contact.user.emailAddress,
                    phone: contact.user.phone
                },
                dsp_id: dspID,
                currency: 'USD',
                status: 'A',
                external_id: externalDealID,
                name: pack.name,
                start_date: helperMethods.dateToYMD(pack.startDate.toISOString()),
                end_date: helperMethods.dateToYMD(pack.endDate.toISOString()),
                auction_type: pack.auctionType,
                deal_section_id: createdSections
            };
        })[0];
    }

    /**
     * method that called after every api call to delete generated deal and clear the request header
     * @param res any - api response object
     * @returns a promise
     */
    function afterAPICall(res: any) {
        apiHelper.setReqOpts({headers: {}});
        if (res && res.httpStatusCode === 200) {
            return deleteDeal(res.body.data[0].proposal_id, res.body.data[0].buyer_id);
        } else {
            return Promise.resolve();
        }
    }

    /**
     * delete generated deal from api call
     * @param dealID Number - dealID of generated deal
     * @returns a promise
     */
    function deleteDeal(proposalID: number, buyerID: number): Promise<any> {
        let dealID;
        let negotiationID;

        return dbm.select('rtbDeals.dealID', 'ixmDealNegotiations.negotiationID')
                .from('rtbDeals')
                .join('ixmNegotiationDealMappings', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID', 'ixmNegotiationDealMappings.negotiationID')
                .where('proposalID', proposalID)
                .andWhere('buyerID', buyerID)
            .then((rows) => {
                negotiationID = rows[0].negotiationID;
                dealID = rows[0].dealID;
            })
            .then(() => {
                return dbm.from('ixmDealNegotiations')
                    .where('negotiationID', negotiationID)
                    .del();
            })
            .then(() => {
                return dbm.from('ixmNegotiationDealMappings')
                    .where('dealID', dealID)
                    .del();
            })
            .then(() => {
                return dbm.from('rtbDealSections')
                    .where('dealID', dealID)
                    .del();
            })
            .then(() => {
                return dbm.from('rtbDeals')
                    .where('dealID', dealID)
                    .del();
            });
    }

});
