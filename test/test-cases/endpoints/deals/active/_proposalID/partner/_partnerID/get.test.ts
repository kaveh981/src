'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../../../common/auth.test';
import { validationTest } from '../../../../../../common/validation.test';

import { Injector } from '../../../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../../../src/lib/database-populator';
import { Helper } from '../../../../../../../src/lib/helper';

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

    let setupResponse = { userID: buyer.user.userID, user: buyer.user, proposalID: proposal.proposal.proposalID, partnerID: publisher.user.userID };
    return setupResponse;

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/active
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DAPP_AUTH = authenticationTest(ROUTE + '/1/partner/1', VERB, commonDatabaseSetup);

/*
 * @case    - The buyer attempts to pass in parameters.
 * @expect  - validation tests to pass.
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_GET_DAPP_VALIDATION = validationTest(ROUTE + '/1/partner', 'get', commonDatabaseSetup, {}, {
    partnerID: {
        type: 'integer'
    }
});

/**
 * Build get specific active deal URL /:proposalID/partner/:partnerID
 */
function buildPath(proposalID: number, partnerID: number) {
    return ROUTE + '/' + proposalID + '/partner/' + partnerID;
}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, active settled deal exists, partner exists
 * @expect  - 200 with one active deal returned
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_01 (assert: test.Test) {

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

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, deleted settled deal exists
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_02 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID, { status: 'D' });

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, settled deal doesn't exist
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_03 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation and settled deal don't exist
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_04 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal, negotiation and settled deal don't exist
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_05 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);

    let route = buildPath(proposal.proposal.proposalID + 1, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal is deleted and targets everyone, negotiation exists for one user only, active settled deal exists
 * @expect  - 200 with one active deal returned for the user in the negotiation, 404 not found for any other user
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_06 (assert: test.Test) {

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

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

    let response2 = await apiRequest.get(route, {}, buyer2.user);

    assert.equal(response2.status, 404);

}

/*
 * @case    - Proposal is active and targets one user, negotiation exists for one user only, active settled deal exists
 * @expect  - 200 with one active deal returned for the user in the negotiation, 404 not found for any other user
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_07 (assert: test.Test) {

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

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200);
    assert.deepEqual(response.body.data, [ Helper.dealsActiveGetToPayload(settledDeal, negotiation, proposal, publisher.user) ]);

    let response2 = await apiRequest.get(route, {}, buyer2.user);

    assert.equal(response2.status, 404);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, active settled deal exists, partner doesn't exist
 * @expect  - 404 not found
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_08 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID);

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID + 1);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - Proposal is active and targets everyone, negotiation exists for user, active settled deal exists, partner exist and is not active
 * @expect  - 403 forbidden
 * @route   - GET deals/active/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_API_GET_DAPP_FUNC_09 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher({ status: 'N' });
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [ section.section.sectionID ]);
    let negotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.publisher.userID, buyer.user.userID);
    await databasePopulator.createSettledDeal(publisher.publisher.userID, [ section.section.sectionID ], negotiation.negotiationID);

    let route = buildPath(proposal.proposal.proposalID, publisher.user.userID);

    /** Test */
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 403);

}
