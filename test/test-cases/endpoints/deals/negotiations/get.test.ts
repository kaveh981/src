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
const route = 'deals/negotiations';

async function authenticationSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID,
                                                                        { ownerStatus: 'accepted' , partnerStatus : 'active' });

}

/**
 * Database setup for pagination tests
 * @return: data: The data required from database setup to create a proposal
 */
async function paginationSetup () {

    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);

    return {
        buyerCompany: buyerCompany,
        pubCompany: pubCompany,
        site: site,
        sender: buyerCompany.user
    };
}

/**
 * Create a deal negotiation. Function should allow successive calls to create new negotiations without problems.
 * @param data: The data required from database setup to create a negotiation
 * @returns The expected payload for that proposal (used by the test case for comparison with the database object).
 */
async function createDealNegotiation (data: ICreateEntityData) {

   let section = await databasePopulator.createSection(data.pubCompany.user.userID, [ data.site.siteID ]);
   let proposal = await databasePopulator.createProposal(data.pubCompany.user.userID, [ section.section.sectionID ]);
   let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, data.buyerCompany.user.userID,
                                                                        { ownerStatus: 'accepted' , partnerStatus : 'active' });

    return (await Helper.dealNegotiationToPayload(dealNegotiation, proposal, data.pubCompany.user, data.pubCompany.user));

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
export let ATW_DN_GET_PAG = paginationTest(route, 'get', paginationSetup, createDealNegotiation);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let response = await apiRequest.get(route, {}, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let response = await apiRequest.get(route, {}, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let pubCompany2 = await databasePopulator.createCompany();
    let publisher2 = await databasePopulator.createPublisher(pubCompany2.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);

    let response = await apiRequest.get(route, {}, publisher2.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [], "No Data Returned");

}

/*
 * @case    - Publisher was not the last to negotiate on their proposal
 * @expect  - 1 DN returned regardless of sender
 * @route   - GET deals/negotiations
 * @status  - passing    
 * @tags    - 
 */
export async function ATW_DN_GET_04 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Publisher was the last to negotiate on their proposal
 * @expect  - 1 DN returned regardless of sender
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_05 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Buyer accepted publisher's proposal right away
 * @expect  - nothing should be returned
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_06 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'accepted'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], []);
}

/*
 * @case    - Publisher accepted their own proposal after a negotiation
 * @expect  - Nothing should be returned
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_07 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], []);
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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'rejected',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], []);
}

/*
 * @case    - Publisher rejects their own proposal after a negotiation
 * @expect  - 1 DN returned (still active)
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_09 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'rejected',
                                                                             sender: 'owner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], []);
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
    let buyerCompany1 = await databasePopulator.createCompany({}, dsp.dspID);
    let buyerCompany2 = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany1.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany2.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation1, proposal, pubCompany.user, buyerCompany1.user),
                                             await Helper.dealNegotiationToPayload(dealNegotiation2, proposal, pubCompany.user, buyerCompany2.user) ],
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
    let buyerCompany1 = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer1 = await databasePopulator.createBuyer(buyerCompany1.user.userID, 'write');
    let buyerCompany2 = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany1.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany2.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
     let response = await apiRequest.get(route, {}, buyer1.user);

     assert.equals(response.status, 200, "Response 200");
     assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation1, proposal, pubCompany.user, pubCompany.user) ],
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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal1 = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let proposal2 = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal1.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    let dealNegotiation2 = await databasePopulator.createDealNegotiation(proposal2.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation1, proposal1, pubCompany.user, pubCompany.user),
                                             await Helper.dealNegotiationToPayload(dealNegotiation2, proposal2, pubCompany.user, pubCompany.user) ],
                     "DN1 and DN2 returned");

}

/*
 * @case    - Proposal is closed and the user is the owner
 * @expect  - 200/ []
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_13(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal1 = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    await databasePopulator.createDealNegotiation(proposal1.proposal.proposalID, pubCompany.user.userID , { ownerStatus: 'deleted' });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], []);

}

/*
 * @case    - Proposal is closed and the user is NOT the owner 
 * @expect  - 200/ []
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_14(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal1 = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    await databasePopulator.createDealNegotiation(proposal1.proposal.proposalID, buyerCompany.user.userID , { ownerStatus: 'deleted' });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], []);

}

/*
 * @case    - 2 buyers: 1 had concluded a deal, the other one was still in negotiations 
 * @expect  - 2 DN's returned that belong to 2 separate buyers, proposal status should be deleted
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_15(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyerCompany2 = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let dealNegotiation1 = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID);
    await databasePopulator.createSettledDeal(buyerCompany.user.userID, [ section.section.sectionID ], dealNegotiation1.negotiationID);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany2.user.userID , { ownerStatus: 'deleted' });

    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [],
        "DN1 and DN2 returned");
}

/*
 * @case    - Creating negotiation with buyerStatus: accepted and pubStatus: accepted
 * @expect  - return nothing
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_16(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'accepted'
                                                                         });

    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [],
        "DN returned");
}

/*
 * @case    - Creating negotiation with buyerStatus: active and pubStatus: accepted
 * @expect  - 200/ return a negotiation
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_17(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted'
                                                                         });

    let response = await apiRequest.get(route, {}, publisher.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, buyerCompany.user) ],
                                                "DN returned");

}

/*
 * @case    - Creating negotiation with buyerStatus: rejected and pubStatus: accepted
 * @expect  - return nothing
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_18(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'rejected',
                                                                             ownerStatus: 'accepted'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [],
        "DN1 and DN2 returned");
}

/*
 * @case    - Creating negotiation with buyerStatus: active and pubStatus: active
 * @expect  - return nothing
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_19(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'active'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [],
        "DN1 and DN2 returned");
}

/*
 * @case    - Creating negotiation with buyerStatus: active and pubStatus: deleted
 * @expect  - return nothing
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_20(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'deleted'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEquals(response.body['data'], [],
        "No deal negotiations are returned");
}

/*
 * @case    - Creating negotiation with buyerStatus: deleted and pubStatus: active
 * @expect  - return nothing
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_21(assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'deleted',
                                                                             ownerStatus: 'active'
                                                                         });

    let response = await apiRequest.get(route, {}, buyer.user);

    assert.equals(response.status, 200, "Response ok");
    assert.deepEqual(response.body['data'], [],
        "DN1 and DN2 returned");
}

/*
 * @case    - Partner company lists negotiations it's involved in after sending a counter-offer.
 * @expect  - Only deal negotiations he's involved in should be returned.
 * @route   - GET deals/negotiations
 * @status  - passing    
 * @tags    - 
 */
export async function ATW_DN_GET_22 (assert: test.Test) {

    assert.plan(2);

    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    let response = await apiRequest.get(route, {}, buyerCompany.user);

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Owner company gets negotiations its involved in after sending a counter-offer.
 * @expect  - Only deal negotiations its involved in should be returned.
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_23 (assert: test.Test) {

    assert.plan(2);
    /** Setup */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    /** Test */
    let response = await apiRequest.get(route, {}, pubCompany.user);

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, buyerCompany.user) ],
                     "1 DN Returned");
}

/*
 * @case    - Internal user impersonate partner company to get negotiations after a counter-offer by partner.
 * @expect  - Only deal negotiations the impersonated company is involved in should be returned.
 * @route   - GET deals/negotiations
 * @status  - passing    
 * @tags    - 
 */
export async function ATW_DN_GET_24 (assert: test.Test) {

    assert.plan(2);

    /** Setup */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let anotherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let internalUser = await databasePopulator.createInternalUser();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID, {
                                                                             partnerStatus: 'accepted',
                                                                             ownerStatus: 'active',
                                                                             sender: 'partner'
                                                                         });
    // another deal negotiation that shouldn't be returned
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, anotherBuyerCompany.user.userID, {
                                                        partnerStatus: 'active',
                                                        ownerStatus: 'accepted',
                                                        sender: 'owner'
                                                    });
    /** Test */
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;
    let response = await apiRequest.get(route, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.equal(response.status, 200, "Response 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, pubCompany.user, pubCompany.user) ],
                     "Correct DN Returned");
}

/*
 * @case    - Internal user impersonate owner company to get negotiation after a counter-offer by owner.
 * @expect  - Only deal negotiations the impersonated company is involved in are returned.
 * @route   - GET deals/negotiations
 * @status  - passing
 * @tags    - 
 */
export async function ATW_DN_GET_25 (assert: test.Test) {

    assert.plan(2);

    /** Setup */
    let dsp = await databasePopulator.createDSP(1);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let anotherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let internalUser = await databasePopulator.createInternalUser();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ]);
    let anotherProposal = await databasePopulator.createProposal(anotherBuyerCompany.user.userID, [ section.section.sectionID ]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, pubCompany.user.userID, {
                                                                             partnerStatus: 'active',
                                                                             ownerStatus: 'accepted',
                                                                             sender: 'owner'
                                                                         });
    // another deal negotiation that shouldn't be returned
    await databasePopulator.createDealNegotiation(anotherProposal.proposal.proposalID, pubCompany.user.userID, {
                                                        partnerStatus: 'active',
                                                        ownerStatus: 'accepted',
                                                        sender: 'owner'
                                                    });
    /** Test */
    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    let response = await apiRequest.get(route, {}, {
        userID: buyerCompany.user.userID,
        accessToken: accessToken
    });

    assert.equal(response.status, 200, "Reponse 200");
    assert.deepEqual(response.body['data'], [ await Helper.dealNegotiationToPayload(dealNegotiation, proposal, buyerCompany.user, pubCompany.user) ],
                     "Correct DN Returned");
}
