'use strict';

import * as knex from 'knex';

import { SettledDealModel } from './settled-deal-model';
import { DatabaseManager } from '../../../lib/database-manager';
import { Helper } from '../../../lib/helper';
import { NegotiatedDealManager } from '../negotiated-deal/negotiated-deal-manager';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { UserModel } from '../../user/user-model';
import { PaginationModel } from '../../pagination/pagination-model';

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

        let settledDeal = new SettledDealModel({
            id: rows[0].id,
            status: Helper.statusLetterToWord(rows[0].status),
            externalDealID: rows[0].externalDealID,
            dspID: rows[0].dspID,
            createDate: rows[0].createDate,
            modifyDate: rows[0].modifyDate,
            startDate: Helper.formatDate(rows[0].startDate),
            endDate: Helper.formatDate(rows[0].endDate),
            price: rows[0].price,
            priority: rows[0].priority,
            auctionType: rows[0].auctionType,
            negotiatedDeal: await this.negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, buyerID, publisherID),
            sections: []
        });

        await Promise.all(rows.map(async (row) => {
            let section = await this.dealSectionManager.fetchDealSectionById(row.sections);

            if (section && section.isActive()) {
                settledDeal.sections.push(section);
            }
        }));

        return settledDeal;

    }

    /**
     * Get all settled deals for the given user.
     * @param user - The user in question.
     * @param pagination - The pagination parameters.
     * @returns A promise for the settled deals with the given user.
     */
    public async fetchSettledDealsFromUser(user: UserModel, pagination: PaginationModel): Promise<SettledDealModel[]> {

        let offset = pagination.getOffset();
        let userID = user.id;
        let userType = user.userType;

        let rows = await this.databaseManager.select('ixmDealNegotiations.proposalID', 'buyerID', 'publisherID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .where('ixmDealNegotiations.buyerID', userID)
                                             .orWhere('ixmDealNegotiations.publisherID', userID)
                                             .limit(pagination.limit + 1)
                                             .offset(offset);

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the deals
        let settledDeals: SettledDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let deal: SettledDealModel;

            if (userType === 'IXMB') {
                deal = await this.fetchSettledDealFromIds(row.proposalID, userID, row.publisherID);
            } else {
                deal = await this.fetchSettledDealFromIds(row.proposalID, row.buyerID, userID);
            }

            if (deal) {
                settledDeals.push(deal);
            }
        }));

        settledDeals.sort((a, b) => a.id - b.id);

        return settledDeals;

    }

    /**
     * Get all available settled deals for the given user.
     * @param user - The user in question.
     * @param pagination - The pagination parameters.
     * @returns A promise for the settled deals with the given user.
     */
    public async fetchActiveSettledDealsFromUser(user: UserModel, pagination: PaginationModel): Promise<SettledDealModel[]> {

        let offset = pagination.getOffset();
        let userID = user.id;
        let userType = user.userType;
        let today = Helper.formatDate(Helper.currentDate());

        let rows = await this.databaseManager.distinct('ixmDealNegotiations.proposalID', 'buyerID', 'publisherID')
                                             .select()
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .join('rtbDeals', 'ixmNegotiationDealMappings.dealID', 'rtbDeals.dealID')
                                             .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                                             .join('rtbSections', 'rtbSections.sectionID', 'rtbDealSections.sectionID')
                                             .join('rtbSiteSections', 'rtbSections.sectionID', 'rtbSiteSections.sectionID')
                                             .join('sites', 'rtbSiteSections.siteID', 'sites.siteID')
                                             .join('users', 'users.userID', 'ixmDealNegotiations.publisherID')
                                             .where(function() {
                                                 this.where('ixmDealNegotiations.buyerID', userID)
                                                     .orWhere('ixmDealNegotiations.publisherID', userID);
                                             })
                                             .andWhere('rtbDeals.status', 'A')
                                             .andWhere('rtbSections.status', 'A')
                                             .andWhere('sites.status', 'A')
                                             .andWhere('rtbDeals.startDate', '<=', 'rtbDeals.endDate')
                                             .andWhere(function() {
                                                 this.where('rtbDeals.endDate', '>=', today)
                                                     .orWhere('rtbDeals.endDate', '0000-00-00');
                                             })
                                             .andWhere('users.status', 'A')
                                             .limit(pagination.limit + 1)
                                             .offset(offset);

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the deals
        let settledDeals: SettledDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let deal: SettledDealModel;

            if (userType === 'IXMB') {
                deal = await this.fetchSettledDealFromIds(row.proposalID, userID, row.publisherID);
            } else {
                deal = await this.fetchSettledDealFromIds(row.proposalID, row.buyerID, userID);
            }

            if (deal) {
                settledDeals.push(deal);
            }
        }));

        settledDeals.sort((a, b) => a.id - b.id);

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
            auctionType: negotiatedDeal.proposedDeal.auctionType,
            sections: negotiatedDeal.proposedDeal.sections,
            priority: 5,
            negotiatedDeal: negotiatedDeal,
            startDate: negotiatedDeal.startDate === null ? negotiatedDeal.proposedDeal.startDate : negotiatedDeal.startDate,
            endDate: negotiatedDeal.endDate === null ? negotiatedDeal.proposedDeal.endDate : negotiatedDeal.endDate,
            price: negotiatedDeal.price === null ? negotiatedDeal.proposedDeal.price : negotiatedDeal.price
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

        let createDateRow = (await transaction.select('createDate')
                                           .from('ixmNegotiationDealMappings')
                                           .where({
                                                negotiationID: negotiatedDeal.id,
                                                dealID: row.dealID
                                           }))[0];

        settledDeal.createDate = createDateRow.createDate;

    }

}

export { SettledDealManager };
