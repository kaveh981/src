'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../../../common/auth.test';
import { paginationTest } from '../../../../../common/pagination.test';
import { validationTest } from '../../../../../common/validation.test';

import { Injector } from '../../../../../../src/lib/injector';
import { APIRequestManager } from '../../../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../../../src/lib/database-populator';
import { Helper } from '../../../../../../src/lib/helper';
import { DatabaseManager } from '../../../../../../src/lib/database-manager';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

/** Test constants */
const route = 'deals/negotiations';
const DSP_ID = 1;

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    let dealNegotiation = await databasePopulator.createDealNegotiation(proposal.proposal.proposalID,
                                                                        publisher.user.userID, buyer.user.userID);
    let setupResponse = {userID: buyer.user.userID, proposalID: proposal.proposal.proposalID, partnerID: publisher.user.userID};
    return setupResponse;
}

/*
 * @case    - The buyer attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_DNPP_GET_AUTH = authenticationTest(route + '/1/1', 'get', commonDatabaseSetup);

/*
 * @case    - The buyer attempts to pass in parameters.
 * @expect  - validation tests to pass.
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_DNPP_GET_VALIDATION =  validationTest(route, 'get', commonDatabaseSetup, {}, {
    proposalID: {
        type: 'integer'
    },

    partnerID: {
        type: 'integer'
    }
});

/*
 * @case    - Negotiation exist, both userID and partnerID are valid  
 * @expect  - 200 OK
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_01(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let buyerPath = buildPath(proposalID, publisherID);
    let publisherPath = buildPath(proposalID, buyerID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 200);
 }

/*
 * @case    - Proposal relating to proposal ID (valid number) does not exist in ixmDealProposals  
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_02(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let nonExistingProposalID = 514;

    let buyerPath = buildPath(nonExistingProposalID, buyerID);
    let publisherPath = buildPath(nonExistingProposalID, publisherID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Buyer is not related to Deal Negotiations concerning Proposal specified   
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_03(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);
    let invalidBuyer = await databasePopulator.createBuyer(DSP_ID);

    let validBuyerPath = buildPath(proposalID, publisherID);
    let invalidBuyerPath = buildPath(invalidBuyer.user.userID, publisherID);

    /** Test */
    let invalidBuyerResponse = await apiRequest.get(invalidBuyerPath, {}, invalidBuyer.user.userID);
    assert.equal(invalidBuyerResponse.status, 404);

    // For reference, make sure API works correctly 
    let buyerResponse = await apiRequest.get(validBuyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 200);
}

/*
 * @case    - Publisher is not related to Deal Negotiations concerning Proposal specified 
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_04(assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);
    let invalidPublisher = await databasePopulator.createPublisher();

    let validPublisherPath = buildPath(proposalID, buyerID);
    let invalidPublisherPath = buildPath(invalidPublisher.user.userID, buyerID);

    /** Test */
    let invalidPubResponse = await apiRequest.get(invalidPublisherPath, {}, invalidPublisher.user.userID);
    assert.equal(invalidPubResponse.status, 404);
}

/*
 * @case    - Partner ID does not exist
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_05(assert: test.Test) {

   /** Setup */
    assert.plan(4);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let buyerPath = buildPath(proposalID, publisherID);
    let publisherPath = buildPath(proposalID, buyerID);

    let invalidBuyerPath = buildPath(proposalID, buyerID + 10);
    let invalidPublisherPath = buildPath(proposalID, publisherID + 10);

    /** Test */
    // For reference, make sure API works correctly 
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 200);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 200);

    let wrongPubResponse = await apiRequest.get(invalidPublisherPath, {}, publisherID);
    assert.equal(wrongPubResponse.status, 404);

    let wrongBuyerResponse = await apiRequest.get(invalidBuyerPath, {}, buyerID);
    assert.equal(wrongBuyerResponse.status, 404);
}

/*
 * @case    - Partner is not an ixmBuyer or ixmPublisher
 * @expect  - 403 FORBIDDEN
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_06(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let invalidPartner = await databasePopulator.createUser({userType: 2});

    let buyerPath = buildPath(proposalID, invalidPartner.userID);
    let publisherPath = buildPath(proposalID, invalidPartner.userID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 403);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 403);
}

/*
 * @case    - Partner ID is not related to the Deal Negotiation relating to the proposal  
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_07(assert: test.Test) {

   /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let anotherBuyer = await databasePopulator.createBuyer(DSP_ID);
    let anotherBuyerID = anotherBuyer.user.userID;
    let anotherPubID = await generatePublisherID();

    let buyerPath = buildPath(proposalID, anotherPubID);
    let publisherPath = buildPath(proposalID, anotherBuyerID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 404);
}

/*
 * @case    - Partner status is not 'A' - Buyer
 * @expect  - 403 FORBIDDEN
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_08_01(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let buyerID = await generateBuyerID();
    let publisher = await databasePopulator.createPublisher( {status: 'N'} );
    let publisherID = publisher.user.userID;
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let buyerPath = buildPath(proposalID, publisherID);

    /** Test */
    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 403);
}

/*
 * @case    - Partner status is not 'A' - Publisher
 * @expect  - 403 FORBIDDEN
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_08_02(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID, {status: 'N'} );
    let buyerID = buyer.user.userID;
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let publisherPath = buildPath(proposalID, buyerID);

    /** Test */
    let buyerResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(buyerResponse.status, 403);
}

/*
 * @case    - Partner is the same user type (Buyers case)
 * @expect  - 403 FORBIDDEN
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_09_01(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let wrongPub = await databasePopulator.createBuyer(DSP_ID);
    let wrongPubID = wrongPub.user.userID;
    let buyerPath = buildPath(proposalID, wrongPubID);

    /** Test */
    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 403);
}

/*
 * @case    - Partner is the same user type (Publishers case)
 * @expect  - 403 FORBIDDEN
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_09_02(assert: test.Test) {

   /** Setup */
    assert.plan(1);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);
    let negotiation = await databasePopulator.createDealNegotiation(proposalID, publisherID, buyerID);

    let wrongBuyerID = await generatePublisherID();
    let buyerPath = buildPath(proposalID, wrongBuyerID);

    /** Test */
    let buyerResponse = await apiRequest.get(buyerPath, {}, publisherID);
    assert.equal(buyerResponse.status, 403);
}

/*
 * @case    - Proposal exists, but not Negotiation started		
 * @expect  - 404 NOT FOUND
 * @route   - GET deals/negotiations/:proposalID/:partnerID
 * @status  - working
 * @tags    - get, negotiaitons, deals
 */
export async function ATW_API_DNPP_GET_10(assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let buyerID = await generateBuyerID();
    let publisherID = await generatePublisherID();
    let proposalID = await generateProposalID(publisherID);

    let buyerPath = buildPath(proposalID, publisherID);
    let publisherPath = buildPath(proposalID, buyerID);

    /** Test */
    let pubResponse = await apiRequest.get(publisherPath, {}, publisherID);
    assert.equal(pubResponse.status, 404);

    let buyerResponse = await apiRequest.get(buyerPath, {}, buyerID);
    assert.equal(buyerResponse.status, 404);
}

/**
 * Create a buyer and return ID of the buyer
 */
async function generateBuyerID() {
    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    return buyer.user.userID;
}

/**
 * Create a publisher and return ID of the publisher
 */
async function generatePublisherID() {
    let publisher = await databasePopulator.createPublisher();
    return publisher.user.userID;
}

/**
 * Create a proposal based on a given publisher and return ID of the proposal
 */
async function generateProposalID(publisherID: number) {
    let site = await databasePopulator.createSite(publisherID);
    let section = await databasePopulator.createSection(publisherID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisherID, [section.section.sectionID]);
    return proposalObj.proposal.proposalID;
}

/**
 * Build get specific negotiation URL /:proposalID/:partnerID
 */
function buildPath(proposalID: number, partnerID: number) {
    return route + '/' + proposalID + '/' + partnerID;
}
