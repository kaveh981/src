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

let route = "/deals/negotiations";

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
export let ATW_DN_GET_AUTH = authenticationTest(route + '/1', 'get', commonDatabaseSetup);

/*
 * @case    - Proposal ID is provided and is a valid number 
 * @expect  - 200 - 1 Deal Negotiation Object returned 
 * @route   - GET deals/negotiations/x
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'],  [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");

}

/*
 * @case    - Proposal ID provided is alphanumeric 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/1a
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is negative 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/-1
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal ID provided is larger than (2^24 - 1) 
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/Math.pow(2, 24)
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal relating to proposal ID (valid number) does not exist in ixmDealProposals  
 * @expect  - 404_PROPOSAL_NOT_FOUND 
 * @route   - GET deals/negotiations/x
 * @status  - In progress
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
    let badProposalID = proposal.proposal.proposalID - 1;
    let response = await apiRequest.get(route + '/' + badProposalID, {}, buyer.user.userID);

    assert.equal(response.status, 404, "Response 404");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Buyer is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/x
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + proposal.proposal.proposalID, {}, otherBuyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher is not related to Deal Negotiations concerning Proposal specified  
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/x
 * @status  - In progress
 * @tags    - 
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
    let response = await apiRequest.get(route + '/' + proposal.proposal.proposalID, {}, otherPublisher.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Proposal exists but Negotiation not started 
 * @expect  - 200_NO_NEGOTIATIONS 
 * @route   - GET deals/negotiations/x
 * @status  - In progress
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
    let response = await apiRequest.get(route + '/' + proposal.proposal.proposalID, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}