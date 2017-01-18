'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../common/auth.test';
import { paginationTest } from '../../../../common/pagination.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

let routePrefix = "deals/negotiations";

async function authenticationDatabaseSetup() {

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

}

/**
 * Database setup for pagination tests. Sender is publisher unlike all other pagination tests
 * @return: data: The data required from database setup to create a proposal
 */
async function paginationSetup () {

    let dsp = await databasePopulator.createDSP(123);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);

    return {
        dsp: dsp,
        pubCompany: pubCompany,
        proposal: proposal,
        sender: pubCompany.user
    };
}

/**
 * Create a deal negotiation and new buyer to go along. Function should allow successive calls to create new negotiations
 * without problems.
 * @param data: The data required from database setup to create a negotiation
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createDealNegotiation (data: ICreateEntityData) {

    let buyerCompany = await databasePopulator.createCompany({}, data.dsp.dspID);
    let dealNegotiation = await databasePopulator.createDealNegotiation(data.proposal.proposal.proposalID, buyerCompany.user.userID,
                                                                       { ownerStatus: 'active', partnerStatus: 'accepted' });

    return (await Helper.dealNegotiationToPayload(dealNegotiation, data.proposal, data.pubCompany.user, buyerCompany.user));

}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export let ATW_DNP_GET_AUTH = authenticationTest(routePrefix + '/1', 'get', authenticationDatabaseSetup);

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export let ATW_DNP_GET_PAG = paginationTest(routePrefix + '/1', 'get', paginationSetup, createDealNegotiation);

/*
 * @case    - Proposal ID is provided and is a valid number 
 * @expect  - 200 - 1 Deal Negotiation Object returned 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing 
 * @tags    - 
 */
export async function ATW_DNP_GET_01 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                                                "1 DN Returned");

}

/*
 * @case    - Proposal ID provided is alphanumeric 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_02 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let badProposalID = proposal.proposal.proposalID + 'a';
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is negative 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_03 (assert: test.Test) {
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let badProposalID = -proposal.proposal.proposalID;
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is larger than (2^24 - 1) 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_04 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let badProposalID = Math.pow(2, 24);
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal relating to proposal ID (valid number) does not exist in ixmDealProposals  
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_05 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let badProposalID = proposal.proposal.proposalID + 1;
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Another Proposal (proposal2) concerning the user exists
 * @expect  - 200 - only the proposal specified is shown
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_06 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let site2 = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createSection(pubCompany.user.userID, [ site2.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let proposal2 = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposal2.proposal.proposalID, buyerCompany.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "Only the proposal specified deal negotiation is shown");
}

/*
 * @case    - Multiple Deal Negotations with the same proposal exist concerning different buyers 
 * @expect  - 200 - only the user's Deal Negotiations are shown
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_07 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let buyerCompany2 = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany2.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "Only the user's deal negotiation shown");
}

/*
 * @case    - Multiple Deal Negotations with the same proposal concerning different publishers  
 * @expect  - 200 - only the user's Deal Negotiations are shown
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_08 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let pubCompany2 = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, pubCompany2.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, publisher.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, buyerCompany.user, buyerCompany.user) ],
                     "Only the user's deal negotiations are shown");
}

/*
 * @case    - Buyer is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_09 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let otherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let otherBuyer = await databasePopulator.createBuyer(otherBuyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, otherBuyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_10 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let otherPubCompany = await databasePopulator.createCompany();
    let otherPublisher = await databasePopulator.createBuyer(otherPubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, otherPublisher.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal exists but Negotiation does not exist 
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_11 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher has deleted the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway 
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    -
 */

export async function ATW_DNP_GET_12 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            ownerStatus: "deleted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Publisher has rejected the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_13 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            ownerStatus: "rejected"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Publisher has accepted the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_14 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            ownerStatus: "accepted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Buyer has deleted the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_15 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            partnerStatus: "deleted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Buyer has rejected the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_16 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            partnerStatus: "rejected"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Buyer has accepted the deal negotiation 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_17 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            partnerStatus: "accepted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Deal Negotiation has not started, datewise 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_18 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            startDate: new Date (3000, 1, 1),
                                                                            endDate: new Date (3001, 1, 1)
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Deal Negotiation has ended (datewise) 
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_19 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            startDate: new Date (1989, 1, 1),
                                                                            endDate: new Date (1990, 1, 1)
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Proposal is paused (status)
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_20 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'paused' });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Proposal has been deleted (status)
 * @expect  - 200/ 1 DN Returned
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_21 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                            ownerStatus: 'active',
                                                                            partnerStatus: 'accepted'
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Proposal owner is inactive
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_22 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany({ status: 'I' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Proposal has expired (datewise)
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_23 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany({ status: 'I' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {
                                                          startDate: new Date(1990, 1, 1),
                                                          endDate: new Date(1995, 1, 1)
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Proposal has not yet started (datewise)
 * @expect  - 200 - 1 Deal negotiation returned anyway
 * @route   - GET deals/negotiations/:proposalID
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_24 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany({ status: 'I' });
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], {
                                                          startDate: new Date(3000, 1, 1),
                                                          endDate: new Date(3001, 1, 1)
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
  * @case    - Proposal is closed and the user is the owner
  * @expect  - 200/ 1 DN Returned
  * @route   - GET deals/negotiations
  * @status  - passing
  * @tags    - 
  */
export async function ATW_DNP_GET_25(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, pubCompany.user.userID,
                                                                        { ownerStatus : 'deleted' });

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation1, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");

}

/*
 * @case    - Proposal is closed and the user is NOT the owner 
 * @expect  - 404
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DNP_GET_26(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID,
                                                                        { ownerStatus : 'deleted' });

    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, publisher.user);
    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation1, proposal, pubCompany.user, buyerCompany.user) ],
                     "1 DN Returned");

}
