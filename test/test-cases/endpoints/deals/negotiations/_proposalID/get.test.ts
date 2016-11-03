'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../common/auth.test';
import { paginationTest } from '../../../../common/pagination.test';

import { Injector } from '../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../src/lib/database-populator';
import { Helper } from '../../../../../src/lib/helper';
import { DatabaseManager } from '../../../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

let routePrefix = "/deals/negotiations";

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations/1
 * @status  - passing
 * @tags    - 
 */
export let ATW_DN_GET_AUTH = authenticationTest(routePrefix + '/1', 'get', commonDatabaseSetup);

/*
 * @case    - Proposal ID is provided and is a valid number 
 * @expect  - 200 - 1 Deal Negotiation Object returned 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - failing (publisher contact info failure) 
 * @tags    - 
 */

export async function ATW_DNP_GET_01 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'],  [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");

}

/*
 * @case    - Proposal ID provided is alphanumeric 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID + 'a'
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_02 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let badProposalID = proposal.proposal.proposalID + 'a';
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is negative 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/-proposal.proposal.proposalID
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_03 (assert: test.Test) {
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let badProposalID = -proposal.proposal.proposalID;
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is larger than (2^24 - 1) 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/Math.pow(2, 24)
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_04 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let badProposalID = Math.pow(2, 24);
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal relating to proposal ID (valid number) does not exist in ixmDealProposals  
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID + 1
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_05 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let badProposalID = proposal.proposal.proposalID + 1;
    let response = await apiRequest.get(routePrefix + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Another Proposal (proposal2) concerning the user exists
 * @expect  - 200 - only the proposal specified is shown
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - 
 * @tags    - 
 */

export async function ATW_DNP_GET_05_01 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let site2 = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let section2 = await databasePopulator.createSection(publisher.publisher.userID, [site2.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let proposal2 = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal2.proposal.proposalID,
                                                                         publisher.user.userID, buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "Only the proposal specified deal negotiation is shown");
}

/*
 * @case    - Multiple Deal Negotations with the same proposal exist concerning different buyers 
 * @expect  - 200 - only the user's Deal Negotiations are shown
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - 
 * @tags    - 
 */

export async function ATW_DNP_GET_05_02 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher.user.userID, buyer2.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "Only the user's deal negotiation shown");
}

/*
 * @case    - Multiple Deal Negotations with the same proposal concerning different publishers  
 * @expect  - 200 - only the user's Deal Negotiations are shown
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - 
 * @tags    - pub, perspective
 */

export async function ATW_DNP_GET_05_03 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let publisher2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(buyer.user.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                         publisher2.user.userID, buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, publisher.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "Only the user's deal negotiations are shown");
}

/*
 * @case    - Buyer is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_06 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let otherBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, otherBuyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - failing (not supported)
 * @tags    - pub, perspective
 */

export async function ATW_DNP_GET_07 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let otherPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, otherPublisher.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal exists but Negotiation not started 
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/proposal.proposal.proposalID
 * @status  - passing
 * @tags    - 
 */

export async function ATW_DNP_GET_08 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

// SHOW DN EVEN WHEN DIFFERENT BUYER/PUB STATUSES STARTING NOW UNTIL END 
export async function ATW_DNP_GET_09 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            pubStatus: "deleted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_10 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            pubStatus: "rejected"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_11 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            pubStatus: "accepted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_12 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            buyerStatus: "deleted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_13 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            buyerStatus: "rejected"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_14 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            buyerStatus: "accepted"
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

// deal negotiation has "not yet started"
export async function ATW_DNP_GET_15 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            startDate: new Date (3000, 1, 1),
                                                                            endDate: new Date (3001, 1, 1)
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

// deal negotiation has ended
export async function ATW_DNP_GET_16 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                            startDate: new Date (1989, 1, 1),
                                                                            endDate: new Date (1990, 1, 1)
                                                                        });
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}



////// proposal statuses

export async function ATW_DNP_GET_17 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {
                                                          status: "paused"
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.user.userID,
                                                                        buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

export async function ATW_DNP_GET_18 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {
                                                          status: "deleted"
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.user.userID,
                                                                        buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

// proposal owner inactive 

export async function ATW_DNP_GET_19 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher({status: 'I'});
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.user.userID,
                                                                        buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

// proposal has expired
export async function ATW_DNP_GET_20 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {
                                                          startDate: new Date(1990, 1, 1),
                                                          endDate: new Date(1995, 1, 1)
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.user.userID,
                                                                        buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

// proposal has not yet started
export async function ATW_DNP_GET_21 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], {
                                                          startDate: new Date(3000, 1, 1),
                                                          endDate: new Date(3001, 1, 1)
                                                          });
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, publisher.user.userID,
                                                                        buyer.user.userID);
    let response = await apiRequest.get(routePrefix + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}
