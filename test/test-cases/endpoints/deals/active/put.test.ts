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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let siteActive = await databasePopulator.createSite(publisher.publisher.userID);
    let siteInactive = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [siteActive.siteID, siteInactive.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    let selected = await databaseManager.select('modifiedDate', 'ixmNegotiationDealMappings.createDate as createDate')
                                            .from('rtbDeals')
                                            .join('ixmNegotiationDealMappings', 'rtbDeals.dealID',
                                                  'ixmNegotiationDealMappings.negotiationID')
                                            .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID',
                                                  'ixmNegotiationDealMappings.negotiationID')
                                            .where({
                                                proposalID: proposal.proposal.proposalID,
                                                publisherID: publisher.user.userID,
                                                buyerID: buyer.user.userID
                                            });

    assert.equal(response.status, 200);
    let expectedResponse = await Helper.dealsActivePutToPayload(proposal, publisher.user, buyer, selected[0].modifiedDate,
                                                                selected[0].createDate);
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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    /** Test */
    let responseNone = await apiRequest.put(route, {}, buyer.user.userID);
    let responseChar = await apiRequest.put(route, { proposal_id: 'goose' }, buyer.user.userID);
    let responseNega = await apiRequest.put(route, { proposal_id: -42 }, buyer.user.userID);
    let responseZero = await apiRequest.put(route, { proposal_id: 0 }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: 1337 }, buyer.user.userID);

    assert.equal(response.status, 404);

}

/*
* @case    - The buyer buys a proposal that is paused.
* @expect  - 403 - FORBIDDEN
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'paused' });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(response.status, 404);

}

/*
* @case    - The buyer buys a proposal that is expired.
* @expect  - 403 - FORBIDDEN 
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_06(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [section.section.sectionID], { endDate: new Date('1992-07-29') });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [section.section.sectionID], { endDate: date });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(response.status, 200);

}

/*
 * @case    - The buyer buys a proposal that hasn't started yet.
 * @expect  - 403 - FORBIDDEN
 * @route   - PUT deals/active
 * @status  - working
 * @tags    - put, live, deals
 */
export async function IXM_API_DEALS_PUT_08(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [section.section.sectionID], { startDate: new Date('2999-07-29') });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(response.status, 403);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [section.section.sectionID], { startDate: date });

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);
    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    await databaseManager.from('rtbDeals').update({ status: 'D' });

    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    await databaseManager.from('rtbDeals').update({ status: 'P' });

    let responseTwo = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let activeSection = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let pausedSection = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [activeSection.section.sectionID, pausedSection.section.sectionID]);

    await databaseManager.from('rtbSections').where('sectionID', pausedSection.section.sectionID).update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(responseOne.status, 200);

}

/*
* @case    - The buyer buys a proposal, but no sections are active.
* @expect  - 404 - Proposal not found. Is not purchasable, does not exist to user
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals
*/
export async function IXM_API_DEALS_PUT_14(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let sectionOne = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let sectionTwo = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID,
        [sectionOne.section.sectionID, sectionTwo.section.sectionID]);

    await databaseManager.from('rtbSections').update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let siteActive = await databasePopulator.createSite(publisher.publisher.userID);
    let siteInactive = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [siteActive.siteID, siteInactive.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    await databaseManager.from('sites').where('siteID', siteInactive.siteID).update({ status: 'P' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(responseOne.status, 200);

}

/*
* @case    - The buyer buys a proposal, but no sites are active.
* @expect  - 404 - Proposal not found. Is not purchasable, does not exist to user
* @route   - PUT deals/active
* @status  - working
* @tags    - put, live, deals, sites
*/
export async function IXM_API_DEALS_PUT_16(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site1 = await databasePopulator.createSite(publisher.publisher.userID);
    let site2 = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site1.siteID, site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    await databaseManager.from('sites').update({ status: 'D' });

    /** Test */
    let responseOne = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let targetedBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {},
                                                          [targetedBuyer.user.userID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

    assert.equal(response.status, 403);
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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let targetedPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID], {},
                                                          [targetedPublisher.user.userID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user.userID);

    assert.equal(response.status, 403);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID], {}
                                                          [buyer.user.userID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID], {}
                                                          [publisher.user.userID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user.userID);

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

    let ownerPublisher = await databasePopulator.createPublisher();
    let buyerPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(ownerPublisher.publisher.userID);
    let section = await databasePopulator.createSection(ownerPublisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(ownerPublisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyerPublisher.user.userID);

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

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, publisher.user.userID);

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
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyer.user.userID);

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
    let ownerBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let buyerBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(ownerBuyer.user.userID, [section.section.sectionID]);

    /** Test */
    let response = await apiRequest.put(route, { proposal_id: proposal.proposal.proposalID }, buyerBuyer.user.userID);

    assert.equal(response.status, 403);

}
