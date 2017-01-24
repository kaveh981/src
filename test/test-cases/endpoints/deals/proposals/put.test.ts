'use strict';

import * as test from 'tape';

import { authenticationTest } from '../../../common/auth.test';
import { validationTest } from '../../../common/validation.test';

import { Injector } from '../../../../src/lib/injector';
import { APIRequestManager } from '../../../../src/lib/request-manager';
import { DatabasePopulator } from '../../../../src/lib/database-populator';
import { DatabaseManager } from '../../../../src/lib/database-manager';

import { Helper } from '../../../../src/lib/helper';

const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');

/** Test constants */
const route = 'deals/proposals';
const DSP_ID = 1;

async function commonDatabaseSetup() {
    let dsp = await databasePopulator.createDSP(123);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let proposal = await databasePopulator.createProposal(pubCompany.user.userID, [ section.section.sectionID ]);
    return {
        user: buyer.user,
        userID: buyer.user.userID,
        proposal_id: proposal.proposal.proposalID,
        partner_id: pubCompany.user.userID,
        inventory: [ section.section.sectionID ],
        partners: [ pubCompany.user.userID ]
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

    auction_type: {
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
            { input: [ 'a', 'c', 'b' ], expect: 400 },
            { input: [ 1.5, 0.1, 2.1 ], expect: 400 },
            { input: [ true, false, true ], expect: 400 }
        ]
    },
    name: {
        type: 'string',
        validParam: 'some name'
    },
    partners: {
        extraCases: [
            { input: [ 'a', 'c', 'b' ], expect: 400 },
            { input: [ 1.5, 0.1, 2.1 ], expect: 400 },
            { input: [ true, false, true ], expect: 400 }
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

async function getProposalInDB(proposalID: number): Promise<any> {
    let row = await databaseManager.select('ixmProposals.proposalID as proposal_id', 'ownerID as owner_id', 'name',
                                           'description', 'status', 'startDate as start_date', 'endDate as end_date', 'price',
                                           'impressions', 'budget', 'auctionType as auction_type', 'terms', 'createDate as created_at',
                                           'modifyDate as modified_at', 'ownerContactID', 'sectionID as inventory', 'userID as partners')
                .from('ixmProposals')
                .leftJoin('ixmProposalTargeting', 'ixmProposalTargeting.proposalID', 'ixmProposals.proposalID')
                .leftJoin('ixmProposalSectionMappings', 'ixmProposalSectionMappings.proposalID', 'ixmProposals.proposalID')
                .where('ixmProposals.proposalID', proposalID);
    return row[0];
}

/*
 * @case    - Publisher create proposal without targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_01 (assert: test.Test) {

    /** Setup */
    assert.plan(8);

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

    let newProposalID = response.body.data[0].proposal_id;
    let newProposalInDB = await getProposalInDB(newProposalID);

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);
    assert.equal(response.body.data[0].owner_id, pubCompany.user.userID);
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(publisher.user));
    assert.deepEqual(Object.assign(newProposalInDB, proposal), newProposalInDB);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ buyerCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, DSP_ID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let anotherPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ pubCompany.user.userID, anotherPubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ publisher.user.userID + 1 ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

    assert.equal(response.status, 404);

}

/*
 * @case    - A target company is not active
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_06 (assert: test.Test) {

    /** Setup */
    assert.plan(3);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let newBuyerCompany = await databasePopulator.createCompany({ status: 'N' }, dsp.dspID);
    let deletedBuyerCompany = await databasePopulator.createCompany({ status: 'D' }, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ newBuyerCompany.user.userID ]
    };
    let newBuyerResponse = await apiRequest.put(route, proposal, pubCompany.user);

    proposal.partners = [ deletedBuyerCompany.user.userID ];
    let deletedBuyerResponse = await apiRequest.put(route, proposal, pubCompany.user);

    /** Test */
    let proposalsInDB = await databaseManager.select().from('ixmProposals');

    assert.equal(newBuyerResponse.status, 403);
    assert.equal(deletedBuyerResponse.status, 403);
    assert.deepEqual(proposalsInDB, []);
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
    await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let anotherPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ anotherPubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, pubCompany.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let anotherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ anotherBuyerCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let anotherBuyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ pubCompany.user.userID, anotherBuyerCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let anotherPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ anotherPubCompany.user.userID, buyerCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        price: 5,
        partners: [ pubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID + 1 ],
        price: 5,
        partners: [ pubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ], { status: 'D' });

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ pubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let anotherPubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ anotherPubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID + 1 ]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ pubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID, { status: 'D' });
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ pubCompany.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ pubCompany.user.userID ],
        start_date: new Date(currentDate.setDate(currentDate.getDate() + 10)),
        end_date: new Date(currentDate.setDate(currentDate.getDate() - 5))
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let currentDate = new Date();

    let proposal = {
        auction_type: 'second',
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5,
        partners: [ pubCompany.user.userID ],
        start_date: new Date(currentDate.setDate(currentDate.getDate() - 10)),
        end_date: new Date(currentDate.setDate(currentDate.getDate() - 5))
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, buyer.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        name: 'fabulous proposal',
        inventory: [ section.section.sectionID ],
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

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

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'great name',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

    assert.equal(response.status, 400);

}

/*
 * @case    - Price is missing
 * @expect  - 400 BAD REQUEST
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_22 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let publisher = await databasePopulator.createPublisher(pubCompany.user.userID, 'write');
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        name: 'great name',
        inventory: [ section.section.sectionID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, publisher.user);

    assert.equal(response.status, 400);

}

/*
 * @case    - Pub company create proposal without targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_23 (assert: test.Test) {

    /** Setup */
    assert.plan(7);

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, pubCompany.user);

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);
    assert.equal(response.body.data[0].owner_id, pubCompany.user.userID);
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(pubCompany.user));

}

/*
 * @case    - Internal user create proposal on behalf of a pub company without targets
 * @expect  - 200 OK, Proposal created
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_24 (assert: test.Test) {

    /** Setup */
    assert.plan(7);

    await databasePopulator.createDSP(DSP_ID);
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);
    let internalUser =  await databasePopulator.createInternalUser();

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5
    };

    let authResponse = await apiRequest.getAuthToken(internalUser.emailAddress, internalUser.password);
    let accessToken = authResponse.body.data.accessToken;

    /** Test */
    let response = await apiRequest.put(route, proposal, {
        userID: pubCompany.user.userID,
        accessToken: accessToken
    });

    assert.equal(response.status, 201);
    assert.equal(response.body.data[0].auction_type, proposal.auction_type);
    assert.equal(response.body.data[0].name, proposal.name);
    assert.equal(response.body.data[0].price, proposal.price);
    assert.equal(response.body.data[0].inventory[0].id, proposal.inventory[0]);
    assert.equal(response.body.data[0].owner_id, pubCompany.user.userID);
    assert.deepEqual(response.body.data[0].contact, Helper.contactToPayload(pubCompany.user));

}

/*
 * @case    - A target user is not a company
 * @expect  - 403 FORBIDDEN
 * @route   - PUT deals/proposals
 * @status  - working
 * @tags    - put, proposals, deals
 */
export async function ATW_API_PUT_DEAPRO_25 (assert: test.Test) {

    /** Setup */
    assert.plan(1);

    let dsp = await databasePopulator.createDSP(DSP_ID);
    let buyerCompany = await databasePopulator.createCompany({}, dsp.dspID);
    let buyer = await databasePopulator.createBuyer(buyerCompany.user.userID, 'write');
    let pubCompany = await databasePopulator.createCompany();
    let site = await databasePopulator.createSite(pubCompany.user.userID);
    let section = await databasePopulator.createSection(pubCompany.user.userID, [ site.siteID ]);

    let proposal = {
        auction_type: 'second',
        inventory: [ section.section.sectionID ],
        name: 'fabulous proposal',
        price: 5,
        partners: [ buyer.user.userID ]
    };

    /** Test */
    let response = await apiRequest.put(route, proposal, pubCompany.user);

    assert.equal(response.status, 403);

}
