'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';
import { paginationTest } from '../../../common/pagination.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';
import { DatabaseManager } from '../../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'deals/negotiations';

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
 * @route   - GET deals/negotiations
 * @status  - broken
 * @tags    - get, deals, auth
 */
/** Generic Authentication Tests */
export let ATW_PA_GET_AUTH = authenticationTest(route, 'get', commonDatabaseSetup);

/*
 * @case    - Publisher has no proposals (and no negotiations)
 * @label   - ATW_DN_GET_F1
 * @route   - GET deals/negotitation
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_F1 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");
}

/*
 * @case    - Publisher has proposals (no negotiations)
 * @label   - ATW_DN_GET_F2
 * @route   - GET deals/negotitation
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_F2 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");

}

/*
 * @case    - Proposal belonging to different publisher containing negotiations exists, but current user is NOT linked to them
 * @label   - ATW_DN_GET_F3
 * @route   - GET deals/negotitation
 * @status  - incomplete
 * @tags    - pub perspective
 */
export async function ATW_DN_GET_F3 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let publisher2 = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);

    let response = await apiRequest.get(route, {}, publisher2.publisher.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");

}

/*
 * @case    - Publisher was not the last to negotiate on its proposal
 * @label   - ATW_DN_GET_F4
 * @route   - GET deals/negotitation
 * @status  - failing    
 * @tags    - timezone error
 */
export async function ATW_DN_GET_F4 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

/*
 * @case    - Publisher was the last to negotiate on its proposal
 * @label   - ATW_DN_GET_F5
 * @route   - GET deals/negotitation
 * @status  - failing
 * @tags    - timezone error
 */
export async function ATW_DN_GET_F5 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

/*
 * @case    - Buyer accepted publisher's proposal right away
 * @label   - ATW_DN_GET_F6
 * @route   - GET deals/negotitation
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_F6 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID,
                                                                        {
                                                                            buyerStatus: 'accepted',
                                                                            pubStatus: 'accepted'
                                                                        });

    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No data returned");
}

/*
 * @case    - Publisher accepted its own proposal after a negotiation
 * @label   - ATW_DN_GET_F7
 * @route   - GET deals/negotitation
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_F7 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [], "No Negotiation Objects returned");
}

/*
 * @case    - Buyer rejects publisher's proposal after negotiations
 * @label   - ATW_DN_GET_F8
 * @route   - GET deals/negotitation
 * @status  - failing
 * @tags    - timezone error
 */
export async function ATW_DN_GET_F8 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'rejected',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

/*
 * @case    - Publisher rejects its own proposal after a negotiation
 * @label   - ATW_DN_GET_F9
 * @route   - GET deals/negotitation
 * @status  - failing
 * @tags    - timezone error
 */
export async function ATW_DN_GET_F9 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'rejected',
                                                                             sender: 'publisher'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user.userID);
    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher, buyer)],
                     "1 DN Returned");
}

/*
 * @case    - Multiple proposals belong to publisher - publisher's perspective
 * @label   - ATW_DN_GET_F10
 * @route   - GET deals/negotitation
 * @status  - incomplete
 * @tags    - pub perspective
 */
export async function ATW_DN_GET_F10 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer1 = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let unusedProposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                          publisher.user.userID, buyer1.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                          publisher.user.userID, buyer2.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });

    let response = await apiRequest.get(route, {}, publisher.user.userID);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal, publisher, buyer1),
                                             Helper.dealNegotiationToPayload(dealNegotiation2, proposal, publisher, buyer2)],
                     "DN1 and DN2 returned");
}

/*
 * @case    - Multiple proposals belong to publisher - buyer's perspective
 * @label   - ATW_DN_GET_F11
 * @route   - GET deals/negotitation
 * @status  - failing
 * @tags    - timezone error
 */
    export async function ATW_DN_GET_F11 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer1 = await databasePopulator.createBuyer(dsp.dspID);
    let buyer2 = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                          publisher.user.userID, buyer1.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                          publisher.user.userID, buyer2.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer1.user.userID);
     assert.equals(response.status, 200, "Response 200");
     assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal, publisher, buyer1)],
                      "1 DN for buyer1 returned returned");
}

/*
 * @case    - Buyer linked to multiple proposals
 * @label   - ATW_DN_GET_F12
 * @route   - GET deals/negotitation
 * @status  - failing
 * @tags    - timezone error
 */
export async function ATW_DN_GET_F12 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal1 = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let proposal2 = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal1.proposal.proposalID,
                                                                          publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'active',
                                                                             pubStatus: 'accepted',
                                                                             sender: 'publisher'
                                                                         });
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal2.proposal.proposalID,
                                                                          publisher.user.userID, buyer.user.userID, {
                                                                             buyerStatus: 'accepted',
                                                                             pubStatus: 'active',
                                                                             sender: 'buyer'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user.userID);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal1, publisher, buyer),
                                             Helper.dealNegotiationToPayload(dealNegotiation2, proposal2, publisher, buyer)],
                     "DN1 and DN2 returned");

}
