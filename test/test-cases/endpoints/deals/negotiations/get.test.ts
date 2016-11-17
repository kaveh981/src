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

async function authenticationSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
}

interface ICreateDealNegotiationData {
    buyer: INewBuyerData;
    publisher: INewPubData;
    proposal: INewProposalData;
}


async function paginationSetup () {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    let data: ICreateDealNegotiationData = {
        buyer: buyer,
        publisher: publisher,
        proposal: proposal
    };

    return data;
}

async function createDealNegotiation (data: ICreateDealNegotiationData) {

   let dealNegotiation;

   try {

        dealNegotiation = await databasePopulator.createDealNegotiation(data.proposal.proposal.proposalID,
                                                                            data.publisher.user.userID, data.buyer.user.userID);
   } catch (err) {

        let site = await databasePopulator.createSite(data.publisher.publisher.userID);
        let section = await databasePopulator.createSection(data.publisher.publisher.userID, [site.siteID]);
        let proposal = await databasePopulator.createProposal(data.publisher.publisher.userID, [section.section.sectionID]);
        dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                            data.publisher.user.userID, data.buyer.user.userID);
        return Helper.dealNegotiationToPayload(dealNegotiation, proposal, data.publisher.user, data.publisher.user);
   }

    return Helper.dealNegotiationToPayload(dealNegotiation, data.proposal, data.publisher.user, data.publisher.user);
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_DN_GET_AUTH = authenticationTest(route, 'get', authenticationSetup);

/*
 * @case    - Different pagination parameters are attempted.
 * @expect  - Pagination tests to pass.
 * @route   - GET deals/active
 * @status  - commented out (must restructure common pagination suite)
 * @tags    - get, deals, auth
 */
export let IXM_API_DN_GET_PAG = paginationTest(route, 'get', paginationSetup, createDealNegotiation);

/*
 * @case    - Publisher has no proposals (and no negotiations)
 * @expect  - No proposals are returned
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_01 (assert: test.Test) {

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
 * @route   - GET deals/negotiations
 * @expect  - No proposals are returned
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_02 (assert: test.Test) {

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
 * @expect  - No DN returned; no proposals belong to the publisher making the request 
 * @route   - GET deals/negotiations
 * @status  - incomplete (pub perspective not a thing yet)
 * @tags    - pub
 */
export async function ATW_DN_GET_03 (assert: test.Test) {

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
 * @expect  - 1 DN returned regardless of sender
 * @route   - GET deals/negotiations
 * @status  - passing    
 * @tags    - 
 */
export async function ATW_DN_GET_04 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher.user, publisher.user)],
                     "1 DN Returned");
}

/*
 * @case    - Publisher was the last to negotiate on its proposal
 * @expect  - 1 DN returned regardless of sender
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_05 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher.user, publisher.user)],
                     "1 DN Returned");
}

/*
 * @case    - Buyer accepted publisher's proposal right away
 * @expect  - Negotiation closed - nothing returned 
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_06 (assert: test.Test) {

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
                                                                            pubStatus: 'accepted'
                                                                        });
    let response = await apiRequest.get(route, {}, buyer.user.userID);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No data returned");
}

/*
 * @case    - Publisher accepted its own proposal after a negotiation
 * @expect  - Negotiation closed - nothing returned
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_07 (assert: test.Test) {

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
 * @expect  - 1 DN returned (still active)
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    -
 */
export async function ATW_DN_GET_08 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher.user, publisher.user)],
                     "1 DN Returned");
}

/*
 * @case    - Publisher rejects its own proposal after a negotiation
 * @expect  - 1 DN returned (still active)
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_09 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation, proposal, publisher.user, publisher.user)],
                     "1 DN Returned");
}

/*
 * @case    - Multiple proposals belong to publisher - publisher's perspective
 * @expect  - 2 DN's returned that belong to 2 separate buyers
 * @route   - GET deals/negotiations
 * @status  - incomplete (pub perspective not a thing yet)
 * @tags    - pub
 */
export async function ATW_DN_GET_10 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal, publisher.user, buyer1.user),
                                             Helper.dealNegotiationToPayload(dealNegotiation2, proposal, publisher.user, buyer2.user)],
                     "DN1 and DN2 returned");
}

/*
 * @case    - Multiple proposals belong to publisher - buyer's perspective
 * @expect  - 1 DN returned since only one of them belongs to the buyer making the request 
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
    export async function ATW_DN_GET_11 (assert: test.Test) {

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
     assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal, publisher.user, publisher.user)],
                      "1 DN for buyer1 returned returned");
}

/*
 * @case    - Buyer linked to multiple proposals by different publishers
 * @expect  - 2 DNs returned belonging to 2 different publishers 
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_12 (assert: test.Test) {

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
    assert.deepEqual(response.body['data'], [Helper.dealNegotiationToPayload(dealNegotiation1, proposal1, publisher.user, publisher.user),
                                             Helper.dealNegotiationToPayload(dealNegotiation2, proposal2, publisher.user, publisher.user)],
                     "DN1 and DN2 returned");

}
