'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';
import { validationTest } from '../../../common/validation.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';
const DSP_ID = 1;

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let proposal = await databasePopulator.createProposal(publisher.publisher.userID, [section.section.sectionID]);
    return {
        userID: buyer.user.userID,
        proposal_id: proposal.proposal.proposalID,
        partner_id: publisher.user.userID,
        inventory: [section.section.sectionID],
        partners: [publisher.publisher.userID]
    };
}

/*
 * @case    - The user attempts to authenticate.
 * @expect  - Authentication tests to pass.
 * @route   - PUT deals/proposals
 * @status  - passing
 * @tags    - pub, deals, auth
 */
export let ATW_API_PUT_DEAPRO_AUTH = authenticationTest(route, 'put', commonDatabaseSetup);

/*
 * @case    - The buyer attempts to pass in parameters.
 * @expect  - validation tests to pass.
 * @route   - PUT deals/proposals
 * @status  - passing
 * @tags    - get, deals, auth
 */
export let ATW_API_PUT_DEAPRO_VALI = validationTest(route, 'put', commonDatabaseSetup, {

    aucntion_type: {
        type: 'integer',
        validParam: 'first'
    },
    budget: {
        type: 'rate',
        validParam: 1
    },
    description: {
        type: 'string',
        validParam: 'first ewr ferf'
    },
    impressions: {
        type: 'rate',
        validParam: 1000
    },
    inventory: {
        extraCases: [
            { input: ['a', 'c', 'b'], expect: 400 },
            { input: [1.5, 0.1, 2.1], expect: 400 },
            { input: [true, false, true], expect: 400 }
        ]
    },
    name: {
        type: 'string',
        validParam: 'some name'
    },
    partners: {
        extraCases: [
            { input: ['a', 'c', 'b'], expect: 400 },
            { input: [1.5, 0.1, 2.1], expect: 400 },
            { input: [true, false, true], expect: 400 }
        ]
    },
    price: {
        type: 'rate',
        validParam: 10
    },
    start_date: {
        type: 'date',
        validParam: '2016-01-01'
    },
    end_date: {
        type: 'date',
        validParam: '2017-01-01'
    },
    terms: {
        type: 'string',
        validParam: 'tegedrg gredger'
    }

});

/*
 * @case    - Publisher create proposal without targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_01 (assert: test.Test) {

    /** Setup */
    assert.plan(5);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);

}

/*
 * @case    - Buyer create proposal without targets
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_02 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - Publisher create proposal with targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_03 (assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [buyer.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);
    assert.deepEqual(response.body.data[0].partners, proposal.partners);

}

/*
 * @case    - Buyer create proposal with targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_04 (assert: test.Test) {

    /** Setup */
    assert.plan(6);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let anotherPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [publisher.user.userID, anotherPublisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);
    assert.deepEqual(response.body.data[0].partners, proposal.partners);

}

/*
 * @case    - A target user doesn't exist
 * @expect  - 404 NOT FOUND
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_05 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [publisher.user.userID + 1]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 404);

}

/*
 * @case    - A target user is not active
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_06 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher({ status: 'D' });
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - A publisher tries to target a publisher
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_07 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let anotherPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [anotherPublisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - A buyer tries to target a buyer
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_08 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let anotherBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [anotherBuyer.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - A buyer tries to target a buyer and a publisher
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_09 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let anotherBuyer = await databasePopulator.createBuyer(dsp.dspID);
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [publisher.user.userID, anotherBuyer.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - A publisher tries to target a buyer and a publisher
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_10 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let anotherPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        name: 'fabulous proposal',
        price: 5,
        partners: [anotherPublisher.user.userID, buyer.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - The user does not specify a section
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_11 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - Section does not exist
 * @expect  - 404 NOT FOUND
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_12 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID + 1],
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 404);

}

/*
 * @case    - One of the Sections is inactive
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_13 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID], { status: 'D' });

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - One of the Sections' site does not belong to either user
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_14 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let anotherPublisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [anotherPublisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - One of the Sections' site does not exist
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_15 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID + 1]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - One of the Sections' site is inactive
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_16 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID, { status: 'D' });
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [publisher.user.userID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 403);

}

/*
 * @case    - Start Date after End Date
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_17 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [publisher.user.userID],
        start_date: new Date(currentDate.setDate(currentDate.getDate() + 10)),
        end_date: new Date(currentDate.setDate(currentDate.getDate() - 5))
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - End date is in the past
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_18 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyer = await databasePopulator.createBuyer(dsp.dspID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5,
        partners: [publisher.user.userID],
        start_date: new Date(currentDate.setDate(currentDate.getDate() - 10)),
        end_date: new Date(currentDate.setDate(currentDate.getDate() - 5))
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - auction_type is missing
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_19 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        name: 'fabulous proposal',
        inventory: [section.section.sectionID],
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - name is missing
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_20 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        inventory: [section.section.sectionID],
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - Inventory is missing
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_21 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'great name',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 400);

}

/*
 * @case    - Inventory is missing
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_22 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let publisher = await databasePopulator.createPublisher();
    let site = await databasePopulator.createSite(publisher.publisher.userID);
    let section = await databasePopulator.createSection(publisher.publisher.userID, [site.siteID]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'great name',
        inventory: [section.section.sectionID]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user.userID);

    assert.equal(response.status, 400);

}
