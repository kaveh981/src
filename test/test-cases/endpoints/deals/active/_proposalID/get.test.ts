'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../common/auth.test';
import { paginationTest } from '../../../../common/pagination.test';
import { validationTest } from '../../../../common/validation.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const ROUTE = 'deals/active';
const VERB = 'get';

/**
 * Create a settled deal for common tests
 * @param [publisher] - The publisher object that will own the settled deal.
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function commonDatabaseSetup (publisher: INewPubData) {

    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);

    if (typeof publisher === 'undefined') {
        publisher = await databasePopulator.createPublisher();
    }

    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID,
                                                                    buyer.user.userID, { pubStatus : 'active', buyerStatus : 'accepted' });
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ],
                                                               negotiation.negotiationID);

    let setupResponse = { userID: buyer.user.userID, proposalID: proposal.proposal.proposalID, partnerID: publisher.user.userID };
    return setupResponse;

}

/**
 * Database setup for pagination tests
 * @return: data: the data required from database setup to create a settled deal
 */
async function paginationSetup () {

    let dsp = await databasePopulator.createDSP(1);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    return {
        dsp: dsp,
        publisher: publisher,
        proposal: proposal,
        section: section,
        sender: publisher.user
    };
}

/**
 * Create a settled deal. Function should allow successive calls to create new settled deals without problems.
 * @param data: the data required from database setup to create a settled deal
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createSettledDeal (data: ICreateEntityData) {

    let buyer = await databasePopulator.createBuyer(data.dsp.dspID);
    let negotiation = await databasePopulator.createDealNegotiation(data.proposal.proposal.proposalID, data.publisher.publisher.userID,
                                                                    buyer.user.userID,
                                                                    { pubStatus : 'active', buyerStatus : 'accepted' });
    let settledDeal = await databasePopulator.createSettledDeal(
                        data.publisher.publisher.userID, [ data.section.section.sectionID ], negotiation.negotiationID);

    return Helper.dealsActiveGetToPayload(settledDeal, negotiation, data.proposal, buyer.user);

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DAP_AUTH = authenticationTest(ROUTE + '/1', VERB, commonDatabaseSetup);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals/active
 * @status  - commented out (must restructure common pagination suite)
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DAP_PAGI = paginationTest(ROUTE + '/1', VERB, paginationSetup, createSettledDeal);

/*
 * @case    - The buyer attempts to pass in parameters.
 * @expect  - validation tests to pass.
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DAP_VALIDATION = validationTest(ROUTE, 'get', commonDatabaseSetup, {}, {
    proposalID: {
        type: 'integer'
    }
});

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, active settled deal exists
 * @expect  - 200 with one active deal returned
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_01 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, deleted settled deal exists
 * @expect  - 200 no content
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_02 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID, { status: 'D' });

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, settled deal doesn't exist
 * @expect  - 200 no content
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_03 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation and settled deal don't exist
 * @expect  - 200 no content
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_04 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, []);

}

/*
 * @case    - Proposal, negotiation and settled deal don't exist
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_05 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + (proposal.proposal.proposalID + 1), {}, buyer.user.userID);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal is deleted and targets everyone, negotiation exists for one user only, active settled deal exists
 * @expect  - 200 with one active deal returned for the user in the negotiation, 404 not found for any other user
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_06 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], { status: 'deleted' });
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

    let response2 = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer2.user.userID);

    assert.equal(response2.status, 404);

}

/*
 * @case    - Proposal is active and targets one user, negotiation exists for one user only, active settled deal exists
 * @expect  - 200 with one active deal returned for the user in the negotiation, 404 not found for any other user
 * @route   - GET deals/active/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAP_FUNC_07 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ], {}, [ buyer.user.userID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    let settledDeal = await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID);

    /** Test */
    let response = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

    let response2 = await apiRequest.get(ROUTE + '/' + proposal.proposal.proposalID, {}, buyer2.user.userID);

    assert.equal(response2.status, 404);

}
