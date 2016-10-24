'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';

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
const DSP_ID = 514;
const ANOTHER_DSP_ID = 438;

/** Generic Authentication Tests */
// export let ATW_DA_PUT_AUTH = authenticationTest(route, 'put');

 /*
 * @case    - Publisher start a negotiation with its own proposal.
 * @label   - ATW_API_negotiation_publisher
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_publisher_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let requestBody = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: publisher.user.userID,
            terms: 'Are you a goose'
    };
    let response = await apiRequest.put(route, requestBody, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher send a negotiation to a buyer.
 * @label   - ATW_API_negotiation_publisher_2_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_publisher_2_1 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });
    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    /** Test */
    let pubRequestBody = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: buyer.user.userID,
            terms: 'No you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'No you are a duck');
}

/*
 * @case    - Publisher send second offer before buyer reply
 * @label   - ATW_API_negotiation_publisher_2_2	
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_publisher_2_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });
    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);
    let pubRequestBody1 = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: buyer.user.userID,
            terms: 'No you are a duck'
    };
    apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    /** Test */
    let pubRequestBody2 = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: buyer.user.userID,
            terms: 'OK maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 403);
}

 /*
 * @case    - A publisher sends an offer for other pub's proposal.
 * @label   - ATW_API_negotiation_publisher_3_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_publisher_3_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let annoyingPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let pubRequestBody = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: publisher.user.userID,
            terms: 'Hello other pub'
    };
    let response = await apiRequest.put(route, pubRequestBody, annoyingPublisher.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Publisher starts a negotiation on its own proposal
 * @label   - ATW_API_negotiation_publisher_4
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_publisher_4 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let pubRequestBody = {
            proposalID: proposalObj.proposal.proposalID,
            partnerID: buyer.user.userID,
            terms: 'I have no idea what I am doing'
    };
    let response = await apiRequest.put(route, { proposalID: proposalObj.proposal.proposalID }, publisher.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Buyer sends an offer to a proposal
 * @label   - ATW_API_negotiation_buyer_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_buyer_1 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let requestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, requestBody, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'I am a goose');

}

/*
 * @case    - Buyer send a getotiation to an existing negotiation
 * @label   - ATW_API_negotiation_buyer_2_1
 * @route   - PUT deals/active
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_buyer_2_1 (assert: test.Test) {

    /** Setup */
    assert.plan(2);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);
    let pubRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'No you are a duck'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'Honk Honk Honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'Honk Honk Honk');
}

 /*
 * @case    - Buyer sends an offer to a negotiation before publisher reply to its previous offer
 * @label   - ATW_API_negotiation_buyer_2_2
 * @route   - PUT deals/negotiaitons
 * @status  - goose
 * @tags    - put, negotiations, deals
 */
export async function ATW_API_negotiation_buyer_2_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'Honk Honk Honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 403);

}

 /*
 * @case    - Different buyers negotiate on the same proposal do not effect each other.
 * @label   - ATW_API_negotiation_buyer_4
 * @route   - PUT deals/negotiaitons
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_buyer_4 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer1 = await databasePopulator.createBuyer(DSP_ID);
    let anotherDsp = await databasePopulator.createDSP(ANOTHER_DSP_ID);
    let buyer2 = await databasePopulator.createBuyer(ANOTHER_DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerOneRequest = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a montreal goose'
    };
    let buyerOneResponse = await apiRequest.put(route, buyerOneRequest, buyer1.user.userID);

    /** Test */
    let buyerTwoRequest = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a toronto goose'
    };
    let buyerTwoResponse = await apiRequest.put(route, buyerTwoRequest, buyer2.user.userID);

    assert.equal(buyerTwoResponse.status, 200);
    assert.equal(buyerOneResponse.body.terms, 'I am a montreal goose');
    assert.equal(buyerTwoResponse.body.terms, 'I am a toronto goose');

}

 /*
 * @case    - Buyer still can reopen the negotiation after pub rejected.
 * @label   - ATW_API_negotiation_state_1_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_1_1 (assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let publisherRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, publisherRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'Honk Honk Honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'Honk Honk Honk');
    assert.equal(response.body.pubStatus, 'active');
    assert.equal(response.body.buyerStatus, 'accepted');
}

 /*
 * @case    - Buyer still can reopen the negotiation after buyer rejected.
 * @label   - ATW_API_negotiation_state_1_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_1_2 (assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'No you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    /** Test */
    let buyerRequestBody3 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'Honk Honk Honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody3, buyer.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'Honk Honk Honk');
    assert.equal(response.body.pubStatus, 'active');
    assert.equal(response.body.buyerStatus, 'accepted');
}

/*
 * @case    - Pub still can reopen the negotiation after pub rejected.
 * @label   - ATW_API_negotiation_state_2_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_2_1 (assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    /** Test */
    let pubRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'You are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'You are a duck');
    assert.equal(response.body.pubStatus, 'accepted');
    assert.equal(response.body.buyerStatus, 'active');
}

/*
 * @case    - Pub still can reopen the negotiation after buyer rejected.
 * @label   - ATW_API_negotiation_state_2_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_2_2 (assert: test.Test) {

    /** Setup */
    assert.plan(4);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'No you are a duck'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        response: 'reject'
    };
    await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    /** Test */
    let pubRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'OK maybe you are a goose'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 200);
    assert.equal(response.body.terms, 'OK maybe you are a goose');
    assert.equal(response.body.pubStatus, 'accepted');
    assert.equal(response.body.buyerStatus, 'active');
}

/*
 * @case    - Buyer send an offer to an accepted negotiation
 * @label   - ATW_API_negotiation_state_3_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_3_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody1, buyer.user.userID);

    let pubRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    /** Test */
    let buyerRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'Honk Honk Honk'
    };
    let response = await apiRequest.put(route, buyerRequestBody2, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher send an offer to an accepted negotiation
 * @label   - ATW_API_negotiation_state_3_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_3_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        terms: 'I am a goose'
    };
    await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    let pubRequestBody1 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        response: 'accept'
    };
    await apiRequest.put(route, pubRequestBody1, publisher.user.userID);

    /** Test */
    let pubRequestBody2 = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        terms: 'No you are a duck'
    };
    let response = await apiRequest.put(route, pubRequestBody2, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Buyer try to reject a negotiation that doesn't exist
 * @label   - ATW_API_negotiation_state_4_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_4_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - Publisher try to reject a negotiation that doesn't exist
 * @label   - ATW_API_negotiation_state_4_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_negotiation_state_4_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'active' });

    /** Test */
    let pubRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: buyer.user.userID,
        response: 'reject'
    };
    let response = await apiRequest.put(route, pubRequestBody, publisher.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - The buyer sends a counter-offer to a proposal that doesn't exist.
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let fakeProposalID = 2333;

    /** Test */
    let buyerRequestBody = {
        proposalID: fakeProposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 404);
}

/*
 * @case    - The buyer sends a counter-offer with a non-numeric proposal id	
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_2_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_2_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let fakeProposalID = 'gooseID';

    /** Test */
    let buyerRequestBody = {
        proposalID: fakeProposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 400);
}

/*
 * @case    - The buyer sends a counter-offer with no proposal id.	
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_2_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_2_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();

    /** Test */
    let buyerRequestBody = {
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 400);
}

/*
 * @case    - The buyer sends a counter-offer for an inactive proposal.		
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_3
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_3 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID], { status: 'deleted' });

    /** Test */
    let buyerRequestBody = {
        proposalID: proposal.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - The buyer sends a counter-offer for an invalid proposal (no active sections). 	
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_4_1
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_4_1 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 403);
}

/*
 * @case    - The buyer sends a counter-offer for an invalid proposal (no active sites). 	
 * @label   - ATW_API_NEGOTIATION_PROPOSAL_4_2
 * @route   - PUT deals/negotiations
 * @status  - goose
 * @tags    - put, negotiaitons, deals
 */
export async function ATW_API_NEGOTIATION_PROPOSAL_4_2 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposalObj = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);

    /** Test */
    let buyerRequestBody = {
        proposalID: proposalObj.proposal.proposalID,
        partnerID: publisher.user.userID,
        terms: 'I am a goose'
    };
    let response = await apiRequest.put(route, buyerRequestBody, buyer.user.userID);

    assert.equal(response.status, 403);
}
