'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';
import { paginationTest } from '../../../common/pagination.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const ROUTE = 'deals/active';
const VERB = 'get';

/**
 * Create a settled deal. Function should allow successive calls to create new proposals without problems.
 * @param [publisher] - The publisher object that will own the settled deal.
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function authenticationSetup (publisher: INewPubData) {

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);

    let pubCompany = await databasePopulator.createCompany();

    if (typeof publisher === 'undefined') {
        publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    }

    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID,
                                                                    { ownerStatus : 'active', partnerStatus : 'accepted' });
    let activeDeal = await databasePopulator.createSettledDeal(pubCompany.user.userID, [ section.section.sectionID ],
                                                               negotiation.negotiationID);

    return Helper.dealsActiveGetToPayload(activeDeal, negotiation, proposal, pubCompany.user);

}

/**
 * Database setup for pagination tests
 * @return: data: the data required from database setup to create a settled deal
 */
async function paginationSetup () {

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);

    return {
        buyerCompany: buyerCompany,
        sender: buyerCompany.user
    };
}

/**
 * Create a settled deal. Function should allow successive calls to create new settled deals without problems.
 * @param data: the data required from database setup to create a settled deal
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createSettledDeal (data: ICreateEntityData) {

    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, data.buyerCompany.user.userID,
                                                                    { ownerStatus : 'active', partnerStatus : 'accepted' });
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID,
        [ section.section.sectionID ],
        negotiation.negotiationID, {
            startDate: tomorrow,
            rate: negotiation.price
        });

    return Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DEAACT_AUTH = authenticationTest(ROUTE, VERB, authenticationSetup);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals/active
 * @status  - commented out (must restructure common pagination suite)
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DEAACT_PAGI = paginationTest(ROUTE, VERB, paginationSetup, createSettledDeal);

 /*
 * @case    - Proposal is still in negotiation, no rtbDeals entry present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Proposal got rejected, no rtbDeals entry present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(
            proposal.proposal.proposalID, buyerCompany.user.userID, { ownerStatus: 'rejected', partnerStatus: 'accepted' }
    );

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Settled deal start date is in the future
 * @expect  - Deal is returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID,
        [ section.section.sectionID ],
        negotiation.negotiationID,
        {
            startDate: tomorrow,
            rate: negotiation.price
        });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}

 /*
 * @case    - Settled deal end date is in the past
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_04 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await databasePopulator.createSettledDeal(
        pubCompany.user.userID,
        [ section.section.sectionID ],
        negotiation.negotiationID,
        {
            startDate: threeDaysAgo,
            endDate: yesterday,
            rate: negotiation.price
        });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - One section linked to the settled deal is deactivated
 * @expect  - A payload containing the deal data, with active sections returned only.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_05 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'A' });
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ], negotiation.negotiationID);

    // We only expect active sections in payload
    proposal.sectionIDs = [ section1.section.sectionID ];

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}

 /*
 * @case    - All sections linked to the settled deal are deactivated
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_06 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section1 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let section2 = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section1.section.sectionID, section2.section.sectionID ], negotiation.negotiationID
    );

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - One site linked to the settled deal is deactivated (section is active)
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_07 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site1 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let site2 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'A' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site1.siteID, site2.siteID ], { status: 'A' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, buyerCompany.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}

 /*
 * @case    - All sites linked to the settled deal (through 1 section) are deactivated (section is active)
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_08 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site1 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let site2 = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site1.siteID, site2.siteID ], { status: 'A' });
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, pubCompany.user.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Publisher who created the proposal is now deactivated
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_09 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany({ status: 'D' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}
//  .----------------.  .----------------.  .----------------.  .----------------. 
// | .--------------. || .--------------. || .--------------. || .--------------. |
// | |  _________   | || |     ____     | || |  ________    | || |     ____     | |
// | | |  _   _  |  | || |   .'    `.   | || | |_   ___ `.  | || |   .'    `.   | |
// | | |_/ | | \_|  | || |  /  .--.  \  | || |   | |   `. \ | || |  /  .--.  \  | |
// | |     | |      | || |  | |    | |  | || |   | |    | | | || |  | |    | |  | |
// | |    _| |_     | || |  \  `--'  /  | || |  _| |___.' / | || |  \  `--'  /  | |
// | |   |_____|    | || |   `.____.'   | || | |________.'  | || |   `.____.'   | |
// | |              | || |              | || |              | || |              | |
// | '--------------' || '--------------' || '--------------' || '--------------' |
//  '----------------'  '----------------'  '----------------'  '----------------' 
// ATW 721
//  /*
//  * @case    - IXM Publisher who created the proposal is now deactivated
//  * @expect  - No deals returned
//  * @route   - GET deals/active
//  * @status  - passing
//  * @tags    - get, active, deals
//  */
// export async function ATW_API_GET_DEAACT_FUNC_09 (assert: test.Test) {

//     /** Setup */
//     assert.plan(2);

//     let dsp = await databasePopulator.createDSP(1);
//     let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
//     let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
//     let pubCompany = await databasePopulator.createCompany({ status: 'D' });
//     let site = await databasePopulator.createSite(pubCompany.user.userID);
//     let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
//     let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
//     let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
//     let settledDeal = await databasePopulator.createSettledDeal(pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID);

//     /** Test */
//     let response = await apiRequest.get(ROUTE, {}, buyer.user);
//     let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

//     assert.equal(response.status, 200);
//     assert.deepEqual(response.body.data, [ expectedPayload ]);

// }

 /*
 * @case    - Proposal got accepted and rtbDeals entry of active status is present
 * @expect  - A payload containing the deal data.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_10 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID, { status: 'A', rate: negotiation.price }
    );

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry of paused status is present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_11 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID, { status: 'P' });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

 /*
 * @case    - Proposal got accepted and rtbDeals entry of deactivated status is present
 * @expect  - No deals returned
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, active, deals
 */
export async function ATW_API_GET_DEAACT_FUNC_12 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createSettledDeal(pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID, { status: 'D' });

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

/*
* @case    - getting deals created on a proposal that is deleted now
* @expect  - A payload containing the deal data.
* @route   - GET deals/active
* @status  - passing
* @tags    - get, active, deals
*/
export async function ATW_API_GET_DEAACT_FUNC_13(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let negotiation = await databasePopulator.createDealNegotiation(
        proposal.proposal.proposalID, buyerCompany.user.userID, { ownerStatus: 'deleted' });
    let settledDeal = await databasePopulator.createSettledDeal(
        pubCompany.user.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE, {}, buyer.user);

    assert.equal(response.status, 200);
    let expectedPayload = Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, pubCompany.user);
    assert.deepEqual(response.body.data, [ expectedPayload ]);

}
