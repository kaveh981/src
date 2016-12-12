'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { NegotiatedDealModel } from './negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { ProposedDealManager } from '../proposed-deal/proposed-deal-manager';
import { UserManager } from '../../user/user-manager';
import { UserModel } from '../../user/user-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { Helper } from '../../../lib/helper';

/** Deal Negotiation model manager */
class NegotiatedDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal proposed deal manager */
    private proposedDealManager: ProposedDealManager;

    /** Internal user manager */
    private userManager: UserManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param proposedDealManager - An instance of the ProposedDealManager.
     * @param userManager - An instance of the User Manager.
     */
    constructor(databaseManager: DatabaseManager, proposedDealManager: ProposedDealManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.proposedDealManager = proposedDealManager;
        this.userManager = userManager;
    }

    /**
     * Get a negotation from the primary id keys: proposalID, buyerID, publisherID.
     * @param proposalID - The id of the original proposed deal.
     * @param buyerID - The id of the buyer of the negotiation.
     * @param publisherID - The id of the publisher of the negotiation.
     * @returns A negotiated deal object or nothing if none can be found.
     */
    public async fetchNegotiatedDealFromIds(proposalID: number, buyerID: number, publisherID: number): Promise<NegotiatedDealModel> {

        let rows = await this.databaseManager.select('negotiationID as id', 'buyerID', 'publisherID', 'startDate', 'endDate', 'terms',
                                                     'price', 'pubStatus as publisherStatus', 'buyerStatus', 'sender', 'createDate',
                                                     'modifyDate', 'budget', 'impressions')
                                             .from('ixmDealNegotiations')
                                             .where('proposalID', proposalID)
                                             .andWhere('buyerID', buyerID)
                                             .andWhere('publisherID', publisherID);

        if (!rows[0]) {
            return;
        }

        let negotiatedDeal = new NegotiatedDealModel({
            id: rows[0].id,
            buyerID: rows[0].buyerID,
            publisherID: rows[0].publisherID,
            publisherStatus: rows[0].publisherStatus,
            buyerStatus: rows[0].buyerStatus,
            sender: rows[0].sender,
            createDate: rows[0].createDate,
            modifyDate: rows[0].modifyDate,
            startDate: rows[0].startDate && Helper.formatDate(rows[0].startDate),
            endDate: rows[0].endDate && Helper.formatDate(rows[0].endDate),
            price: rows[0].price,
            impressions: rows[0].impressions,
            budget: rows[0].budget,
            terms: rows[0].terms
        });

        await Promise.all([ (async () => {
            negotiatedDeal.proposedDeal = await this.proposedDealManager.fetchProposedDealFromId(proposalID);
        })(), (async () => {
            negotiatedDeal.buyerInfo = await this.userManager.fetchUserFromId(rows[0].buyerID);
        })(), (async () => {
            negotiatedDeal.publisherInfo = await this.userManager.fetchUserFromId(rows[0].publisherID);
        })() ]);

        return negotiatedDeal;

    }

    /**
     * Get list of latest deals in negotiation for the user  
     * @param user - the user in question
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its next_page_url field based on whether there
     * is more data left to get or not.
     * @returns A list of negotiated deal objects.
     */
    public async fetchNegotiatedDealsFromUser(user: UserModel, pagination: PaginationModel) {

        let userID = user.id;
        let userType = user.userType;
        let offset = pagination.getOffset();

        let rows = await this.databaseManager.select('proposalID', 'buyerID', 'publisherID')
                                             .from('ixmDealNegotiations')
                                             .where('buyerID', userID)
                                             .orWhere('publisherID', userID)
                                             .limit(pagination.limit + 1)
                                             .offset(offset);

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the negotiations
        let negotiatedDealArray: NegotiatedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let negotiatedDeal: NegotiatedDealModel;

            if (userType === 'IXMB') {
                negotiatedDeal = await this.fetchNegotiatedDealFromIds(row.proposalID, userID, row.publisherID);
            } else {
                negotiatedDeal = await this.fetchNegotiatedDealFromIds(row.proposalID, row.buyerID, userID);
            }

            if (negotiatedDeal) {
                negotiatedDealArray.push(negotiatedDeal);
            }
        }));

        negotiatedDealArray.sort((a, b) => a.id - b.id);

        return negotiatedDealArray;

    }

    /**
     * Get list of available deals in negotiation for the user  
     * @param user - the user in question
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its next_page_url field based on whether there
     * is more data left to get or not.
     * @returns A list of negotiated deal objects.
     */
    public async fetchActiveNegotiatedDealsFromUser(user: UserModel, pagination: PaginationModel) {

        let userID = user.id;
        let userType = user.userType;
        let offset = pagination.getOffset();

        let rows = await this.databaseManager.distinct('ixmDealNegotiations.proposalID', 'buyerID', 'publisherID')
                                             .select()
                                             .from('ixmDealNegotiations')
                                             .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                             .join('ixmProposalSectionMappings', 'ixmDealProposals.proposalID', 'ixmProposalSectionMappings.proposalID')
                                             .join('rtbSections', 'rtbSections.sectionID', 'ixmProposalSectionMappings.sectionID')
                                             .join('rtbSiteSections', 'rtbSections.sectionID', 'rtbSiteSections.sectionID')
                                             .join('sites', 'rtbSiteSections.siteID', 'sites.siteID')
                                             .join('users', 'users.userID', 'ixmDealProposals.ownerID')
                                             .where(function() {
                                                 this.where('buyerID', userID)
                                                     .orWhere('publisherID', userID);
                                             })
                                             .andWhere(function() {
                                                 this.where(function() {
                                                     this.where('pubStatus', 'accepted')
                                                         .andWhere('buyerStatus', 'active');
                                                 })
                                                 .orWhere(function() {
                                                     this.where('buyerStatus', 'accepted')
                                                         .andWhere('pubStatus', 'active');
                                                 });
                                             })
                                             .andWhere('ixmDealProposals.status', 'active')
                                             .andWhere('users.status', 'A')
                                             .andWhere('rtbSections.status', 'A')
                                             .andWhere('sites.status', 'A')
                                             .limit(pagination.limit + 1)
                                             .offset(offset);

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the negotiations
        let negotiatedDealArray: NegotiatedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let negotiatedDeal: NegotiatedDealModel;

            if (userType === 'IXMB') {
                negotiatedDeal = await this.fetchNegotiatedDealFromIds(row.proposalID, userID, row.publisherID);
            } else {
                negotiatedDeal = await this.fetchNegotiatedDealFromIds(row.proposalID, row.buyerID, userID);
            }

            if (negotiatedDeal) {
                negotiatedDealArray.push(negotiatedDeal);
            }
        }));

        negotiatedDealArray.sort((a, b) => a.id - b.id);

        return negotiatedDealArray;

    }

    /**
     * Get proposalID specific deal negotiations from proposal id and user id 
     * @param userID - The user id of one of the negotiating parties
     * @param proposalID - The id of the proposal being negotiated
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its next_page_url field based on whether there
     * is more data left to get or not.
     * @returns A list of negotiated deal objects.
     */
    public async fetchNegotiatedDealsFromUserProposalIds(userID: number, proposalID: number, pagination: PaginationModel) {

        let offset = pagination.getOffset();

        let rows = await this.databaseManager.select('publisherID', 'buyerID')
                                             .from('ixmDealNegotiations')
                                             .where({
                                                 proposalID: proposalID,
                                                 buyerID: userID
                                             })
                                             .orWhere({
                                                 proposalID: proposalID,
                                                 publisherID: userID
                                             })
                                             .limit(pagination.limit + 1)
                                             .offset(offset);

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the negotiations
        let negotiatedDealArray: NegotiatedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let negotiatedDeal = await this.fetchNegotiatedDealFromIds(proposalID, row.buyerID, row.publisherID);

            if (negotiatedDeal) {
                negotiatedDealArray.push(negotiatedDeal);
            }
        }));

        negotiatedDealArray.sort((a, b) => a.id - b.id);

        return negotiatedDealArray;

    }

    /**
     * Insert a new negotiated deal into the database, fails if the negotiated deal already has an id or else populates the id.
     * @param negotiatedDeal - The negotiated deal to insert.
     * @param transation - A knex transaction object to use.
     */
    public async insertNegotiatedDeal(negotiatedDeal: NegotiatedDealModel, transaction?: knex.Transaction) {

        if (negotiatedDeal.id) {
            throw new Error('Cannot insert a negotiated deal with an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertNegotiatedDeal(negotiatedDeal, trx);
            });
            return;
        }

        // Creation timestamp has to be made up - MySQL only takes care of the update timestamp
        if (!negotiatedDeal.createDate) {
            negotiatedDeal.createDate = Helper.currentDate();
        }

        await transaction.insert({
            proposalID: negotiatedDeal.proposedDeal.id,
            publisherID: negotiatedDeal.publisherID,
            buyerID: negotiatedDeal.buyerID,
            price: negotiatedDeal.price,
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            budget: negotiatedDeal.budget,
            impressions: negotiatedDeal.impressions,
            terms: negotiatedDeal.terms,
            sender: negotiatedDeal.sender,
            pubStatus: negotiatedDeal.publisherStatus,
            buyerStatus: negotiatedDeal.buyerStatus,
            createDate: negotiatedDeal.createDate,
            modifyDate: negotiatedDeal.modifyDate
        }).into('ixmDealNegotiations');

        // Get the id and set it in the negotiated deal object.
        let negotiationInserted = (await transaction.select('negotiationID', 'modifyDate')
                                                    .from('ixmDealNegotiations')
                                                    .where('proposalID', negotiatedDeal.proposedDeal.id)
                                                    .andWhere('buyerID', negotiatedDeal.buyerID)
                                                    .andWhere('publisherID', negotiatedDeal.publisherID))[0];

        negotiatedDeal.id = negotiationInserted.negotiationID;
        negotiatedDeal.modifyDate = negotiationInserted.modifyDate;

    }

    /**
     * Create a negotiation from proposed deal where both parties have accepted.
     * @param proposedDeal - The proposed deal to build off of.
     * @param buyerID - The id of the buyer of the proposal.
     * @returns A NegotiatedDealModel.
     */
    public async createAcceptedNegotiationFromProposedDeal(proposedDeal: ProposedDealModel, userInfo: UserModel) {

        let buyerID: number;
        let publisherID: number;

        if (userInfo.userType === 'IXMB') {
            buyerID = userInfo.id;
            publisherID = proposedDeal.ownerID;
        } else {
            buyerID = proposedDeal.ownerID;
            publisherID = userInfo.id;
        }

        let negotiatedDeal = new NegotiatedDealModel({
            buyerID: buyerID,
            buyerInfo: await this.userManager.fetchUserFromId(buyerID),
            publisherID: publisherID,
            publisherInfo: proposedDeal.ownerInfo,
            publisherStatus: 'accepted',
            buyerStatus: 'accepted',
            sender: 'buyer',
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            proposedDeal: proposedDeal,
            startDate: null,
            endDate: null,
            price: null,
            impressions: null,
            budget: null,
            terms: null
        });

        return negotiatedDeal;

    }

    /**
     * Create a new negotiation between a buyer and a sender.
     * @param proposedDeal - The proposed deal model this is based off of.
     * @param buyerID - The buyer id for the buyer of this negotiation.
     * @param publisherID - The id of the publisher for this negotiation.
     * @param sender - The person who is creating this counter-offer.
     * @param negotiationFields - The fields to use as the negotiation terms.
     * @returns A negotiated deal model with the appropriate fields updated.
     */
    public async createNegotiationFromProposedDeal(
        proposedDeal: ProposedDealModel, buyerID: number, publisherID: number, sender: 'buyer' | 'publisher', negotiationFields: any = {}) {

        let negotiatedDeal = new NegotiatedDealModel({
            buyerID: buyerID,
            buyerInfo: await this.userManager.fetchUserFromId(buyerID),
            publisherID: publisherID,
            publisherInfo: await this.userManager.fetchUserFromId(publisherID),
            publisherStatus: sender === 'publisher' ? 'accepted' : 'active',
            buyerStatus: sender === 'buyer' ? 'accepted' : 'active',
            sender: sender,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            proposedDeal: proposedDeal,
            startDate: negotiationFields.startDate || null,
            endDate: negotiationFields.endDate || null,
            price: negotiationFields.price || null,
            impressions: negotiationFields.impressions || null,
            budget: negotiationFields.budget || null,
            terms: negotiationFields.terms || null
        });

        return negotiatedDeal;

    }

    /**
     * Update a negotiation with new parameters sent in the request and return new modifyDate
     * @param negotiatedDeal - The negotiated deal to update.
     * @param transaction - An optional transaction to use. 
     */
    public async updateNegotiatedDeal(negotiatedDeal: NegotiatedDealModel, transaction?: knex.Transaction) {

        if (!negotiatedDeal.id) {
            throw new Error('Cannot update a negotiated deal without an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.updateNegotiatedDeal(negotiatedDeal, trx);
            });
            return;
        }

        await transaction.from('ixmDealNegotiations').update({
            proposalID: negotiatedDeal.proposedDeal.id,
            publisherID: negotiatedDeal.publisherID,
            buyerID: negotiatedDeal.buyerID,
            price: negotiatedDeal.price,
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            budget: negotiatedDeal.budget,
            impressions: negotiatedDeal.impressions,
            terms: negotiatedDeal.terms,
            sender: negotiatedDeal.sender,
            pubStatus: negotiatedDeal.publisherStatus,
            buyerStatus: negotiatedDeal.buyerStatus,
            createDate: negotiatedDeal.createDate,
            modifyDate: negotiatedDeal.modifyDate
        }).where('negotiationID', negotiatedDeal.id);

        // Get the id and set it in the negotiated deal object.
        let negotiationUpdated = (await transaction.select('negotiationID', 'modifyDate')
                                                   .from('ixmDealNegotiations')
                                                   .where('proposalID', negotiatedDeal.proposedDeal.id)
                                                   .andWhere('buyerID', negotiatedDeal.buyerID)
                                                   .andWhere('publisherID', negotiatedDeal.publisherID))[0];

        negotiatedDeal.id = negotiationUpdated.negotiationID;
        negotiatedDeal.modifyDate = negotiationUpdated.modifyDate;

    }

    /**
     * Delete associated negotiations of the given proposalID
     * @param {number} proposalID the proposal ID to be deleted
     * @param {string} userType the user type of the requester
     * @param {knex.Transaction} [transaction] database transaction
     */
    public async deleteNegotiationsFromProposalId(proposalID: number, user: UserModel, transaction?: knex.Transaction) {

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.deleteNegotiationsFromProposalId(proposalID, user, trx);
            });
            return;
        }

        let userStatus: { buyerStatus?: string, pubStatus?: string };

        if (user.userType === 'IXMB') {
            userStatus = { buyerStatus: 'deleted' };
        } else {
            userStatus = { pubStatus: 'deleted' };
        }

        await transaction.from('ixmDealNegotiations')
                         .update(userStatus)
                         .where('proposalID', proposalID);

    }
}

export { NegotiatedDealManager };
