'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';
import { DatabaseManager } from '../../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'deals/active';

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let siteActive = await databasePopulator.createSite(pubCompany.user.userID);
    let siteInactive = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ siteActive.siteID, siteInactive.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
}

/*
* @case    - The buyer attempts to authenticate.
* @expect  - Authentication tests to pass.
* @route   - PUT deals/active
* @status  - working
* @tags    - get, deals, auth
*/
export let IXM_API_DEALS_PUT_AUTH = authenticationTest(route, 'put', commonDatabaseSetup);

/*
* @case    - The buyer buys a proposal.
* @expect  - A payload containing the deal data.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    let selected = await databaseManager.select('modifiedDate', 'ixmNegotiationDealMappings.createDate as createDate')
                                            .from('rtbDeals')
                                            .join('ixmNegotiationDealMappings', 'rtbDeals.dealID',
                                                  'ixmNegotiationDealMappings.dealID')
                                            .join('ixmNegotiations', 'ixmNegotiations.negotiationID',
                                                  'ixmNegotiationDealMappings.negotiationID')
                                            .where({
                                                proposalID: proposal.proposal.proposalID,
                                                userID: pubCompany.user.userID,
                                                partnerID: buyerCompany.user.userID
                                            });

    assert.equal(response.status, 200);
    let expectedResponse = await Helper.dealsActivePutToPayload(proposal, pubCompany.user, buyerCompany, selected[0].modifiedDate, selected[0].createDate);
    assert.deepEqual(response.body['data'][0], expectedResponse);

}

/*
 * @case    - The buyer does supplies invalid proposal IDs.
 * @expect  - The API responds with 400s.
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals
 */
export async function IXM_API_DEALS_PUT_02(assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    /** Test */
    let responseNone = await apiRequest.put(route, {}, buyer.user);
    let responseChar = await apiRequest.put(route, { proposal_id: 'goose' }, buyer.user);
    let responseNega = await apiRequest.put(route, { proposal_id: -42 }, buyer.user);
    let responseZero = await apiRequest.put(route, { proposal_id: 0 }, buyer.user);

    assert.equal(responseNone.status, 400);
    assert.equal(responseChar.status, 400);
    assert.equal(responseNega.status, 400);
    assert.equal(responseZero.status, 400);

}

/*
 * @case    - The buyer does supplies a proposal ID that doesn't exist.
 * @expect  - The response has status code 404.
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals
 */
export async function IXM_API_DEALS_PUT_03(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: 1337 }, buyer.user);

    assert.equal(response.status, 404);

}

/*
* @case    - The buyer buys a proposal that is paused.
* @expect  - 403 - Not available for purchase
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'paused' });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 403);

}

/*
* @case    - The buyer buys a proposal that is deleted.
* @expect  - 404 - Proposal not found 
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_05(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 404);

}

/*
* @case    - The buyer buys a proposal that is expired.
* @expect  - 403 - Not avaialable for purchase
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_06(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: new Date('1992-07-29') });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 403);

}

/*
* @case    - The buyer buys a proposal that expires today.
* @expect  - The response has status code 200.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_07(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let date = new Date((new Date().toDateString()));
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: date });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 200);

}

/*
 * @case    - The buyer buys a proposal that hasn't started yet.
 * @expect  - 200 OK
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals
 */
export async function IXM_API_DEALS_PUT_08(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ],
                                                            { startDate: new Date('2999-07-29'), endDate: new Date('2999-12-01') });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 200);

}

/*
* @case    - The buyer buys a proposal that starts today.
* @expect  - The response has status code 200.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_09(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let date = new Date((new Date().toDateString()));
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { startDate: date });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 200);

}

/*
* @case    - The buyer buys a proposal twice.
* @expect  - The first response has status code 200. The second response has status code 403.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_10(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);
    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 200);
    assert.equal(responseTwo.status, 403);

}

/*
* @case    - The buyer buys a proposal, and attempts to buy it again but it is disabled.
* @expect  - The first response has status code 200. The second response has status code 403.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    await databaseManager.from('rtbDeals').update({ status: 'D' });

    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 200);
    assert.equal(responseTwo.status, 403);

}

/*
* @case    - The buyer buys a proposal, and attempts to buy it again but it is paused.
* @expect  - The first response has status code 200. The second response has status code 403.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_12(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    await databaseManager.from('rtbDeals').update({ status: 'P' });

    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 200);
    assert.equal(responseTwo.status, 403);

}

/*
* @case    - The buyer buys a proposal, but one out of two sections are not active.
* @expect  - The response has status code 200.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_13(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let activeSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let pausedSection = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ activeSection.section.sectionID, pausedSection.section.sectionID ]);

    await databaseManager.from('rtbSections').where('sectionID', pausedSection.section.sectionID).update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 200);

}

/*
* @case    - The buyer buys a proposal, but no sections are active.
* @expect  - 403 - Proposal found, but not avaialabe for purchase 
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_14(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let sectionOne = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let sectionTwo = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ sectionOne.section.sectionID, sectionTwo.section.sectionID ]);

    await databaseManager.from('rtbSections').update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 403);

}

/*
* @case    - The buyer buys a proposal, but one out of two sites aren't active.
* @expect  - The response has status code 200.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals, sites
*/
export async function IXM_API_DEALS_PUT_15(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let siteActive = await databasePopulator.createSite(pubCompany.user.userID);
    let siteInactive = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ siteActive.siteID, siteInactive.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    await databaseManager.from('sites').where('siteID', siteInactive.siteID).update({ status: 'P' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 200);

}

/*
* @case    - The buyer buys a proposal, but no sites are active.
* @expect  - 403 - Proposal found but not avaialable for purchase.
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals, sites
*/
export async function IXM_API_DEALS_PUT_16(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site1 = await databasePopulator.createSite(pubCompany.user.userID);
    let site2 = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site1.siteID, site2.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    await databaseManager.from('sites').update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(responseOne.status, 403);

}

/*
 * @case    - The current buyer is not targeted by proposal it is trying to accept but another buyer is  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - The buyer is not able to accept proposal 
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal, targeting
 */
export async function IXM_API_DEALS_PUT_17(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let targetedBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ targetedBuyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 404);
}

/*
 * @case    - The current publisher is not targeted by proposal it is trying to accept but another publisher is  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 404 - The publisher is not able to accept proposal 
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal, targeting
 */
export async function IXM_API_DEALS_PUT_18(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let targetedPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ targetedPubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - The current buyer is targeted by proposal it is trying to accept  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 200 - New deal created 
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal, targeting
 */
export async function IXM_API_DEALS_PUT_19(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 200);

}

/*
 * @case    - The current publisher is targeted by proposal it is trying to accept  
 * @setup   - create dsp, create buyer, create publisher, create site , create section
 *  create proposal, create user targeting
 * @expect  - 200 - New deal created 
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal, targeting
 */
export async function IXM_API_DEALS_PUT_20(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], {},
                                                          [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user);

    assert.equal(response.status, 200);

}

/*
 * @case    - Publisher tries to buy proposal owned by another publisher 
 * @setup   - create 2 publishers, create site, section, proposal owned by 1st publisher
 * , send request as 2nd publisher
 * @expect  - 403 - FORBIDDEN  
 * @route   - PUT deals/active
 * @status  - working 
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_21(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let ownerPubCompany = await databasePopulator.createCompany();
    let buyerPubCompany = await databasePopulator.createCompany();
    let buyerPublisher = await databasePopulator.createPublisher(buyerPubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(ownerPubCompany.user.userID);
    let section = await databasePopulator.createSection(ownerPubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(ownerPubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyerPublisher.user);

    assert.equal(response.status, 403);

}

/*
 * @case    - Publisher tries to buy own proposal
 * @setup   - create publisher, create site, section and proposal,
 * , send request same publisher
 * @expect  - 403 - FORBIDDEN  
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_22(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user);

    assert.equal(response.status, 403);

}

/*
 * @case    - Buyer tries to buy own proposal
 * @setup   - create dsp, create buyer, publisher, create site, section and proposal,
 * send request as same buyer
 * @expect  - 403 - FORBIDDEN 
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_23(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user);

    assert.equal(response.status, 403);

}

/*
 * @case    - Buyer tries to buy proposal owned by another buyer 
 * @setup   - create dsp, create 2 buyers, create publisher, create site, create section, create proposal 
 * @expect  - 403 - FORBIDDEN  
 * @route   - PUT deals/active
 * @status  - working 
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_24(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let pubCompany = await databasePopulator.createCompany();
    let ownerBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyerBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyerBuyer = await databasePopulator.createBuyer(buyerBuyerCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(ownerBuyerCompany.user.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyerBuyer.user);

    assert.equal(response.status, 403);

}

/*
 * @case    - Buyer tries to buy proposal without sections
 * @expect  - 403 - FORBIDDEN  
 * @route   - PUT deals/active
 * @status  - working 
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_25(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let pubCompany = await databasePopulator.createCompany();
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [], {}, [ buyerCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyerCompany.user);

    assert.equal(response.status, 403);

}

/*
 * @case    - Pub tries to buy proposal without sections
 * @expect  - 403 - FORBIDDEN  
 * @route   - PUT deals/active
 * @status  - working 
 * @tags    - put, live, deals, proposal
 */
export async function IXM_API_DEALS_PUT_26(assert: test.Test) {

     /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let pubCompany = await databasePopulator.createCompany();
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [], {}, [ pubCompany.user.userID ]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, pubCompany.user);

    assert.equal(response.status, 403);

}
