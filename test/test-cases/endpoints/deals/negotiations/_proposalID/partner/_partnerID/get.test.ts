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
const route = 'deals/negotiations';
const DSP_ID = 1;
const currentDate: Date = new Date();

/**
 * Create a proposal based on a given publisher and return ID of the proposal
 */
async function generateProposalID(publisherID: number) {
    let site = await databasePopulator.createSite(publisherID);
    let section = await databasePopulator.createSection(publisherID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(publisherID, [ section.section.sectionID ]);
    return proposalObj.proposal.proposalID;
}

/**
 * Build get specific negotiation URL /:proposalID/partner/:partnerID
 */
function buildPath(proposalID: number, partnerID: number) {
    return route + '/' + proposalID + '/partner/' + partnerID;
}

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    await databasePopulator.createDealNegotiation(proposal.proposal.proposalID, buyerCompany.user.userID,
                                                                        { ownerStatus: 'active', partnerStatus: 'accepted' });
    let setupResponse = { user: buyer.user, userID: buyer.user.userID,
                        proposalID: proposal.proposal.proposalID, partnerID: pubCompany.user.userID };

    return setupResponse;
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_DNPP_GET_AUTH = authenticationTest(route + '/1/partner/1', 'get', commonDatabaseSetup);

/*
 * @case    - The buyer attempts to pass in parameters.
 * @expect  - validation tests to pass.
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_DNPP_GET_VALIDATION = validationTest(route + '/1/partner', 'get', commonDatabaseSetup, {}, {
    partnerID: {
        type: 'integer'
    }
});

/*
 * @case    - Negotiation exist, both userID and partnerID are valid  
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let buyerPath = buildPath(proposalID, pubCompany.user.userID);
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 200);
 }

/*
 * @case    - Proposal relating to proposal ID (valid number) does not exist in ixmDealProposals  
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let nonExistingProposalID = 514;

    let buyerPath = buildPath(nonExistingProposalID, buyerCompany.user.userID);
    let publisherPath = buildPath(nonExistingProposalID, pubCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Buyer is not related to Deal Negotiations concerning Proposal specified   
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);
    let invalidBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let invalidBuyer = await databasePopulator.createBuyer(invalidBuyerCompany.user.userID, 'write');

    let validBuyerPath = buildPath(proposalID, pubCompany.user.userID);
    let invalidBuyerPath = buildPath(invalidBuyer.user.userID, pubCompany.user.userID);

    /** Test */
    let invalidBuyerResponse = await apiRequest.get(invalidBuyerPath, {}, invalidBuyer.user);
    assert.equal(invalidBuyerResponse.status, 404);

    // For reference, make sure API works correctly 
    let buyerResponse = await apiRequest.get(validBuyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 200);
}

/*
 * @case    - Publisher is not related to Deal Negotiations concerning Proposal specified 
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);
    let invalidPubCompany = await databasePopulator.createCompany();
    let invalidPublisher = await databasePopulator.createPublisher(invalidPubCompany.user.userID, 'write');

    let invalidPublisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let invalidPubResponse = await apiRequest.get(invalidPublisherPath, {}, invalidPublisher.user);
    assert.equal(invalidPubResponse.status, 404);
}

/*
 * @case    - Partner ID does not exist
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_05(assert: test.Test) {

   /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let buyerPath = buildPath(proposalID, pubCompany.user.userID);
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    let invalidBuyerPath = buildPath(proposalID, buyerCompany.user.userID + 10);
    let invalidPublisherPath = buildPath(proposalID, pubCompany.user.userID + 10);

    /** Test */
    // For reference, make sure API works correctly 
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 200);

    let wrongPubResponse = await apiRequest.get(invalidPublisherPath, {}, publisher.user);
    assert.equal(wrongPubResponse.status, 404);

    let wrongBuyerResponse = await apiRequest.get(invalidBuyerPath, {}, buyer.user);
    assert.equal(wrongBuyerResponse.status, 404);
}

/*
 * @case    - Partner is not an ixmBuyer or ixmPublisher
 * @expect  - 404 
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_06(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let invalidPartner = await databasePopulator.createUser({ userType: 2 });

    let buyerPath = buildPath(proposalID, invalidPartner.userID);
    let publisherPath = buildPath(proposalID, invalidPartner.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Partner ID is not related to the Deal Negotiation relating to the proposal  
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_07(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let anotherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let anotherPubCompany = await databasePopulator.createCompany();

    let buyerPath = buildPath(proposalID, anotherPubCompany.user.userID);
    let publisherPath = buildPath(proposalID, anotherBuyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Partner status is not 'A' - Buyer sends request
 * @expect  - 404
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_08_01(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    // Create buyer user and its company
    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');

    // Create new publisher company (status: 'N') and a negotiation
    let newPubCompany = await databasePopulator.createCompany({ status: 'N' });
    let newPubCompanyProposalID = await generateProposalID(newPubCompany.user.userID);
    await databasePopulator.createDealNegotiation(newPubCompanyProposalID, buyerCompany.user.userID);

    // Create deactivated publisher company (status: 'D') and a negotiation
    let deactivatedPubCompany = await databasePopulator.createCompany({ status: 'D' });
    let deactivatedPubCompanyProposalID = await generateProposalID(deactivatedPubCompany.user.userID);
    await databasePopulator.createDealNegotiation(deactivatedPubCompanyProposalID, buyerCompany.user.userID);

    // Create url for negotiation with new pub company
    let buyerPathNewPub = buildPath(newPubCompanyProposalID, newPubCompany.user.userID);
    // Create url for negotiation with deactivated pub company
    let buyerPathDeactivatedPub = buildPath(deactivatedPubCompanyProposalID, deactivatedPubCompany.user.userID);

    /** Test */
    // Test for negotiation with New Publisher
    let buyerResponseNewPub = await apiRequest.get(buyerPathNewPub, {}, buyer.user);
    assert.equal(buyerResponseNewPub.status, 404, "Status should be 404");

    // Test for negotiation with deactivated Publisher
    let buyerResponseDeactivatedPub = await apiRequest.get(buyerPathDeactivatedPub, {}, buyer.user);
    assert.equal(buyerResponseDeactivatedPub.status, 404, "Status should be 404");

}

/*
 * @case    - Partner status is not 'A' - Publisher sends request
 * @expect  - 404
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_08_02(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    // Create a DSP
    await databasePopulator.createDSP(DSP_ID);

    // Create publisher user and its company with an open proposal
    let publisherCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createBuyer(publisherCompany.user.userID, 'write');
    let proposalID = await generateProposalID(publisherCompany.user.userID);

    // Create new buyer company (status: 'N') and a negotiation
    let newBuyerCompany = await databasePopulator.createCompany({ status: 'N' }, DSP_ID);
    await databasePopulator.createDealNegotiation(proposalID, newBuyerCompany.user.userID);

    // Create deactivated buyer company (status: 'D') and a negotiation
    let deactivatedBuyerCompany = await databasePopulator.createCompany({ status: 'D' }, DSP_ID);
    await databasePopulator.createDealNegotiation(proposalID, deactivatedBuyerCompany.user.userID);

    // Create url for negotiation with new pub company
    let pubPathNewBuyer = buildPath(proposalID, newBuyerCompany.user.userID);
    // Create url for negotiation with deactivated pub company
    let pubPathDeactivatedBuyer = buildPath(proposalID, deactivatedBuyerCompany.user.userID);

    /** Test */
    // Test for negotiation with New Buyer
    let pubResponseNewBuyer = await apiRequest.get(pubPathNewBuyer, {}, publisher.user);
    assert.equal(pubResponseNewBuyer.status, 404, "Status shuold be 404");

    // Test for negotiation with deactivated Buyer
    let pubResponseDeactivatedBuyer = await apiRequest.get(pubPathDeactivatedBuyer, {}, publisher.user);
    assert.equal(pubResponseDeactivatedBuyer.status, 404, "Status should be 404");

}

/*
 * @case    - Partner is the same user type (Buyers case)
 * @expect  - 404
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_09_01(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let wrongPubCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyerPath = buildPath(proposalID, wrongPubCompany.user.userID);

    /** Test */
    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Partner is the same user type (Publishers case)
 * @expect  - 404
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_09_02(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);

    let wrongBuyerCompany = await databasePopulator.createCompany();
    let buyerPath = buildPath(proposalID, wrongBuyerCompany.user.userID);

    /** Test */
    let buyerResponse = await apiRequest.get(buyerPath, {}, publisher.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Proposal exists, but no Negotiation started		
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_10(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let proposalID = await generateProposalID(pubCompany.user.userID);

    let buyerPath = buildPath(proposalID, pubCompany.user.userID);
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Nogotiation exists on an paused proposal 		
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_11(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'paused' });
    let proposalID = proposalObj.proposal.proposalID;
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);
    let buyerPath = buildPath(proposalID, pubCompany.user.userID);
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 200);
}

/*
 * @case    - Nogotiation exists on an deleted proposal user is NOT the owner
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_12(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let proposalID = proposalObj.proposal.proposalID;
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID, { ownerStatus: 'deleted' });
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 200);
    assert.deepEqual(pubResponse.body['data'], [ Helper.dealNegotiationToPayload(negotiation, proposalObj, pubCompany.user, buyerCompany.user) ],
        "DN1 returned");
}

/*
 * @case    - Nogotiation exists on an deleted proposal user is the owner
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_13(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposalObj = await databasePopulator.createProposal(buyerCompany.user.userID, [ section.section.sectionID ], { status: 'deleted' });
    let proposalID = proposalObj.proposal.proposalID;
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, pubCompany.user.userID, { partnerStatus: 'deleted' });
    let buyerPath = buildPath(proposalID, pubCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(pubResponse.status, 200);
    assert.deepEqual(pubResponse.body['data'], [ Helper.dealNegotiationToPayload(negotiation, proposalObj, buyerCompany.user, pubCompany.user) ],
        "DN1 returned");
}

/*
 * @case    - Nogotiation exists on an expired proposal 		
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/partner/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_14(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let passedDate = new Date(currentDate.setDate(currentDate.getDate() - 5));
    let proposalObj = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ], { endDate: passedDate });
    let proposalID = proposalObj.proposal.proposalID;
    await databasePopulator.createDealNegotiation(proposalID, buyerCompany.user.userID);
    let buyerPath = buildPath(proposalID, pubCompany.user.userID);
    let publisherPath = buildPath(proposalID, buyerCompany.user.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisher.user);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyer.user);
    assert.equal(buyerResponse.status, 200);
}
