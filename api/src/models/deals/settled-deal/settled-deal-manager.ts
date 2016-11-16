'use strict';

import * as knex from 'knex';

import { SettledDealModel } from './settled-deal-model';
import { DatabaseManager } from '../../../lib/database-manager';
import { Helper } from '../../../lib/helper';
import { NegotiatedDealManager } from '../negotiated-deal/negotiated-deal-manager';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { ProposedDealModel } from '../proposed-deal/proposed-deal-model';
import { DealSectionModel } from '../../deal-section/deal-section-model';

/** Active deal model manager */
class SettledDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal negotation manager */
    private negotiatedDealManager: NegotiatedDealManager;

    /** Internal deal section manager */
    private dealSectionManager: DealSectionManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param negotiationManager - An instance of the negotiation manager.
     */
    constructor(databaseManager: DatabaseManager, negotiationManager: NegotiatedDealManager, dealSectionManager: DealSectionManager) {
        this.databaseManager = databaseManager;
        this.negotiatedDealManager = negotiationManager;
        this.dealSectionManager = dealSectionManager;
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
                                                     'ixmNegotiationDealMappings.createDate', 'modifiedDate as modifyDate',
                                                     'rtbDeals.startDate', 'rtbDeals.endDate', 'rtbDeals.rate as price',
                                                     'priority', 'rtbDeals.auctionType', 'sectionID as sections')
                                             .from('rtbDeals')
                                             .join('ixmNegotiationDealMappings', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                                             .join('ixmDealNegotiations', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                                             .where('ixmDealNegotiations.proposalID', proposalID)
                                             .where('buyerID', buyerID)
                                             .where('publisherID', publisherID);

        if (!rows[0]) {
            return;
        }

        let settledDealObject = new SettledDealModel(rows[0]);
        let sections: DealSectionModel[] = [];

        for (let i = 0; i < rows.length; i++) {
            let section = await this.dealSectionManager.fetchDealSectionById(rows[i].sections);

            if (!section) {
                continue;
            }

            sections.push(section);
        }

        settledDealObject.sections = sections;
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

        let offset = (Number(pagination.page) - 1) * Number(pagination.limit);

        let settledDeals: SettledDealModel[] = [];

        let rows = await this.databaseManager.select('ixmDealNegotiations.proposalID', 'publisherID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .where('ixmDealNegotiations.buyerID', buyerID)
                                             .limit(pagination.limit)
                                             .offset(offset);

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

        let negotiatedFields = {
            startDate: negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate,
            price: negotiatedDeal.price
        };

        for (let key in negotiatedFields) {
            if (negotiatedFields[key] === null) {
                negotiatedFields[key] = negotiatedDeal.proposedDeal[key];
            }
        }

        let settledDeal = new SettledDealModel( Object.assign({
            status: 'active',
            dspID: dspID,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            auctionType: negotiatedDeal.proposedDeal.auctionType,
            sections: negotiatedDeal.proposedDeal.sections,
            priority: 5,
            negotiatedDeal: negotiatedDeal
        }, negotiatedFields ));

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
            auctionType: settledDeal.auctionType,
            rate: settledDeal.price,
            status: settledDeal.status[0].toUpperCase(),
            startDate: settledDeal.startDate || '0000-00-00',
            endDate: settledDeal.endDate || '0000-00-00',
            externalDealID: externalDealID,
            priority: settledDeal.priority,
            openMarket: 0,
            noPayoutMode: 0,
            manualApproval: 1
        }).into('rtbDeals');

        // Get newly created deal id and modified date.
        let row = (await transaction.select('dealID', 'modifiedDate').from('rtbDeals').where('externalDealID', externalDealID))[0];

        settledDeal.id = row.dealID;
        settledDeal.externalDealID = externalDealID;
        settledDeal.modifyDate = row.modifiedDate;

        // Insert into deal section mapping
        for (let i = 0; i < proposedDeal.sections.length; i++) {
            await transaction.insert({
                dealID: row.dealID,
                sectionID: settledDeal.sections[i].id
            }).into('rtbDealSections');
        }

        // Insert proposal deal mapping
        await transaction.insert({
            negotiationID: negotiatedDeal.id,
            dealID: row.dealID
        }).into('ixmNegotiationDealMappings');

    }

}

export { SettledDealManager };
