'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { Logger } from '../../../lib/logger';
import { NegotiatedDealModel } from './negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { ProposedDealManager } from '../proposed-deal/proposed-deal-manager';
import { UserManager } from '../../user/user-manager';

const Log: Logger = new Logger('ACTD');

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
                'price', 'pubStatus as publisherStatus', 'buyerStatus', 'sender', 'createDate', 'modifyDate', 'budget', 'impressions')
            .from('ixmDealNegotiations')
            .where('proposalID', proposalID)
            .andWhere('buyerID', buyerID)
            .andWhere('publisherID', publisherID);

        if (!rows[0]) {
            return;
        }

        let negotiatedDeal = new NegotiatedDealModel(rows[0]);
        negotiatedDeal.proposedDeal = await this.proposedDealManager.fetchProposedDealFromId(proposalID);
        negotiatedDeal.buyerInfo = await this.userManager.fetchUserFromId(negotiatedDeal.buyerID);
        negotiatedDeal.publisherInfo = await this.userManager.fetchUserFromId(negotiatedDeal.publisherID);

        return negotiatedDeal;

    }

    /**
     * Get list of latest deals in negotiation for the buyer  
     * @param buyerID - The id of the buyer of the negotiation.
     * @returns A list of negotiated deal objects.
     */
    public async fetchNegotiatedDealsFromBuyerId(buyerID: number, pagination: any): Promise<NegotiatedDealModel[]> {

        let rows = await this.databaseManager.select('proposalID', 'publisherID')
                    .from('ixmDealNegotiations')
                    .where('buyerID', buyerID)
                    .limit(Number(pagination.limit))
                    .offset(Number(pagination.offset));

        let negotiatedDealArray: NegotiatedDealModel[] = [];

        for (let i = 0; i < rows.length; i++) {
                let negotiatedDeal = await this.fetchNegotiatedDealFromIds(rows[i].proposalID, buyerID, rows[i].publisherID);
                negotiatedDealArray.push(negotiatedDeal);
        }

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
            let date: Date = new Date();
            negotiatedDeal.createDate = this.dateToMysqlTimestamp(date.toISOString());
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
    public async createAcceptedNegotiationFromProposedDeal(proposedDeal: ProposedDealModel, buyerID: number): Promise<NegotiatedDealModel> {

        let negotiatedDeal = new NegotiatedDealModel({
            buyerID: buyerID,
            buyerInfo: await this.userManager.fetchUserFromId(buyerID),
            publisherID: proposedDeal.ownerID,
            publisherInfo: proposedDeal.ownerInfo,
            publisherStatus: 'accepted',
            buyerStatus: 'accepted',
            sender: 'buyer',
            createDate: this.dateToMysqlTimestamp(new Date()),
            modifyDate: this.dateToMysqlTimestamp(new Date()),
            proposedDeal: proposedDeal,
            startDate: proposedDeal.startDate,
            endDate: proposedDeal.endDate,
            price: proposedDeal.price,
            impressions: proposedDeal.impressions,
            budget: proposedDeal.budget,
            terms: proposedDeal.terms
        });

        return negotiatedDeal;

    }

    /**
     * Create a new negotiation between a buyer and a sender.
     * @param proposedDeal - The proposed deal model this is based off of.
     * @param buyerID - The buyer id for the buyer of this negotiation.
     * @param publisherID - The id of the publisher for this negotiation.
     * @param negotiationFields - The fields to use as the negotiation terms.
     * @returns A negotiated deal model with the appropriate fields updated.
     */
    public async createNegotiationFromProposedDeal(
        proposedDeal: ProposedDealModel, buyerID: number, publisherID: number, sender: 'buyer' | 'publisher', negotiationFields: any) {

        let negotiatedDeal = new NegotiatedDealModel({
            buyerID: buyerID,
            buyerInfo: await this.userManager.fetchUserFromId(buyerID),
            publisherID: publisherID,
            publisherInfo: await this.userManager.fetchUserFromId(publisherID),
            publisherStatus: sender === 'publisher' ? 'accepted' : 'active',
            buyerStatus: sender === 'buyer' ? 'accepted' : 'active',
            sender: sender,
            createDate: this.dateToMysqlTimestamp(new Date()),
            modifyDate: this.dateToMysqlTimestamp(new Date()),
            proposedDeal: proposedDeal,
            startDate: negotiationFields.startDate || proposedDeal.startDate,
            endDate: negotiationFields.endDate || proposedDeal.endDate,
            price: negotiationFields.price || proposedDeal.price,
            impressions: negotiationFields.impressions || proposedDeal.impressions,
            budget: negotiationFields.budget || proposedDeal.budget,
            terms: negotiationFields.terms || proposedDeal.terms
        });

        return negotiatedDeal;
    }

    /**
     * Update a negotiation with new parameters sent in the request and return new modifyDate
     * @param negotiatedDeal - The negotiated deal to update.
     * @param transaction - An optional transaction to use. 
     */
    public async updateNegotiatedDeal (negotiatedDeal: NegotiatedDealModel, transaction?: knex.Transaction): Promise<string> {

        if (!negotiatedDeal.id) {
            throw new Error('Cannot update a negotiated deal without an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertNegotiatedDeal(negotiatedDeal, trx);
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
     * Changes the date format to yyyy-mm-dd hh:mm:ss (MySQL datetime format)
     * @param date - The date in ISO format
     * @returns A string with the date in the format of yyyy-mm-dd hh:mm:ss
     */
    private dateToMysqlTimestamp(date: string | Date): string {

        date = new Date(date);

        return date.getFullYear() + '-' +
            ('00' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('00' + date.getDate()).slice(-2) + ' ' +
            ('00' + date.getHours()).slice(-2) + ':' +
            ('00' + date.getMinutes()).slice(-2) + ':' +
            ('00' + date.getSeconds()).slice(-2);

    }

}

export { NegotiatedDealManager };
