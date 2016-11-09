'use strict';

import * as knex from 'knex';

import { SettledDealModel } from './settled-deal-model';
import { DatabaseManager } from '../../../lib/database-manager';
import { Helper } from '../../../lib/helper';
import { NegotiatedDealManager } from '../negotiated-deal/negotiated-deal-manager';
import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';

/** Active deal model manager */
class SettledDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal negotation manager */
    private negotiatedDealManager: NegotiatedDealManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param negotiationManager - An instance of the negotiation manager.
     */
    constructor(databaseManager: DatabaseManager, negotiationManager: NegotiatedDealManager) {
        this.databaseManager = databaseManager;
        this.negotiatedDealManager = negotiationManager;
    }

    /** 
     * Get a settled deal from the id keys
     * @param proposalID - The id of the original proposed deal.
     * @param buyerID - The id of the buyer for the settled deal.
     * @param publisherID - The id of the publisher for the settled deal.
     * @returns A promise for the settled deal object.
     */
    public async fetchSettledDealFromIds(proposalID: number, buyerID: number, publisherID: number): Promise<SettledDealModel> {

        let rows = await this.databaseManager.select('rtbDeals.dealID as id', 'rtbDeals.status as status',
                                                     'rtbDeals.externalDealID as externalDealID', 'rtbDeals.dspID as dspID',
                                                     'createDate', 'modifiedDate as modifyDate', 'rtbDeals.startDate', 'rtbDeals.endDate')
                                             .from('rtbDeals')
                                             .join('ixmNegotiationDealMappings', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                                             .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .where('ixmDealNegotiations.proposalID', proposalID)
                                             .where('buyerID', buyerID)
                                             .where('publisherID', publisherID);

        if (!rows[0]) {
            return;
        }

        let settledDealObject = new SettledDealModel(rows[0]);

        settledDealObject.negotiatedDeal = await this.negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID);
        settledDealObject.status = Helper.statusLetterToWord(settledDealObject.status);

        return settledDealObject;

    }

    /**
     * Get all settled deals with the given buyer.
     * @param buyerID - The id for the buyer.
     * @param pagination - The pagination parameters.
     * @returns A promise for the settled deals with the given buyer.
     */
    public async fetchSettledDealsFromBuyerId(buyerID: number, pagination: any): Promise<SettledDealModel[]> {

        let settledDeals: SettledDealModel[] = [];

        let rows = await this.databaseManager.select('ixmDealNegotiations.proposalID', 'publisherID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .where('ixmDealNegotiations.buyerID', buyerID)
                                             .limit(pagination.limit)
                                             .offset(pagination.offset);

        for (let i = 0; i < rows.length; i++) {
            let deal = await this.fetchSettledDealFromIds(rows[i].proposalID, buyerID, rows[i].publisherID);
            settledDeals.push(deal);
        }

        return settledDeals;

    }

    /**
     * Create a settled deal model from a negotiation.
     * @param negotiatedDeal - The negotiated deal model.
     * @param dspID - The dspID to associate to the settled deal.
     * @returns A settled deal model.
     */
    public createSettledDealFromNegotiation(negotiatedDeal: NegotiatedDealModel, dspID: number): SettledDealModel {

        let settledDeal = new SettledDealModel({
            status: 'active',
            dspID: dspID,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            negotiatedDeal: negotiatedDeal
        });

        return settledDeal;

    }

    /**
     * Insert a new settled deal into the database, fails if the settled deal already has an id or else populates the id.
     * @param settledDeal - The settled deal to insert.
     * @param transaction - A transaction object to use.
     */
    public async insertSettledDeal(settledDeal: SettledDealModel, transaction?: knex.Transaction) {

        if (settledDeal.id) {
            throw new Error('Cannot insert a settled deal with an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertSettledDeal(settledDeal, trx);
            });
            return;
        }

        let externalDealID;

        if (settledDeal.externalDealID) {
            externalDealID = settledDeal.externalDealID;
        } else {
            externalDealID = Helper.generateExternalDealId(settledDeal.negotiatedDeal.proposedDeal.id,
                                                           settledDeal.negotiatedDeal.buyerID, settledDeal.negotiatedDeal.publisherID);
        }

        let negotiatedDeal = settledDeal.negotiatedDeal;
        let proposedDeal = negotiatedDeal.proposedDeal;

        // Begin database queries
        await transaction.insert({
            userID: proposedDeal.ownerID,
            dspID: settledDeal.dspID,
            name: proposedDeal.name,
            auctionType: proposedDeal.auctionType,
            rate: negotiatedDeal.price,
            status: settledDeal.status[0].toUpperCase(),
            startDate: negotiatedDeal.startDate || '0000-00-00',
            endDate: negotiatedDeal.endDate || '0000-00-00',
            externalDealID: externalDealID,
            priority: 5,
            openMarket: 0,
            noPayoutMode: 0,
            manualApproval: 1
        }).into('rtbDeals');

        // Get newly created deal id
        let dealID = (await transaction.select('dealID').from('rtbDeals').where('externalDealID', externalDealID))[0].dealID;

        settledDeal.id = dealID;
        settledDeal.externalDealID = externalDealID;

        // Insert into deal section mapping
        for (let i = 0; i < proposedDeal.sections.length; i++) {
            await transaction.insert({
                dealID: dealID,
                sectionID: proposedDeal.sections[i]
            }).into('rtbDealSections');
        }

        // Insert proposal deal mapping
        await transaction.insert({
            negotiationID: negotiatedDeal.id,
            dealID: dealID
        }).into('ixmNegotiationDealMappings');

    }

}

export { SettledDealManager };
