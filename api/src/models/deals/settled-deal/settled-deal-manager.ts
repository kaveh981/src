'use strict';

import * as knex from 'knex';

import { SettledDealModel } from './settled-deal-model';
import { DatabaseManager } from '../../../lib/database-manager';
import { Helper } from '../../../lib/helper';
import { NegotiatedDealManager } from '../negotiated-deal/negotiated-deal-manager';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { NegotiatedDealModel } from '../negotiated-deal/negotiated-deal-model';
import { MarketUserModel } from '../../market-user/market-user-model';
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
     * @param partnerID - The id of the partner in the negotiation.
     * @returns A promise for the settled deal object.
     */
    public async fetchSettledDealFromIds(proposalID: number, partnerID: number): Promise<SettledDealModel> {

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
                                             .where('partnerID', partnerID);

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
            negotiatedDeal: await this.negotiatedDealManager.fetchNegotiatedDealFromIds(proposalID, partnerID),
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
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its nextPageURL field based on whether there
     * is more data left to get or not.
     * @returns A promise for the settled deals with the given user.
     */
    public async fetchSettledDealsFromUser(user: MarketUserModel, pagination: PaginationModel): Promise<SettledDealModel[]> {

        let offset = pagination.getOffset();

        let rows = await this.databaseManager.select('ixmDealNegotiations.proposalID', 'partnerID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .where('partnerID', user.company.id)
                                             .orWhere('ownerID', user.company.id)
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
            let deal = await this.fetchSettledDealFromIds(row.proposalID, row.partnerID);

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
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its nextPageURL field based on whether there
     * is more data left to get or not.
     * @returns A promise for the settled deals with the given user.
     */
    public async fetchActiveSettledDealsForUser(user: MarketUserModel, pagination: PaginationModel): Promise<SettledDealModel[]> {

        let offset = pagination.getOffset();
        let today = Helper.formatDate(Helper.currentDate());

        let rows = await this.databaseManager.distinct('ixmDealNegotiations.proposalID', 'partnerID')
                                             .select()
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .join('rtbDeals', 'ixmNegotiationDealMappings.dealID', 'rtbDeals.dealID')
                                             .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                                             .join('rtbSections', 'rtbSections.sectionID', 'rtbDealSections.sectionID')
                                             .join('rtbSiteSections', 'rtbSections.sectionID', 'rtbSiteSections.sectionID')
                                             .join('sites', 'rtbSiteSections.siteID', 'sites.siteID')
                                             .join('users', 'users.userID', 'ixmDealNegotiations.partnerID')
                                             .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                             .where(function() {
                                                 this.where('partnerID', user.company.id)
                                                     .orWhere('ownerID', user.company.id);
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
            let deal = await this.fetchSettledDealFromIds(row.proposalID, row.partnerID);

            if (deal) {
                settledDeals.push(deal);
            }
        }));

        settledDeals.sort((a, b) => a.id - b.id);

        return settledDeals;

    }

    /**
     * Get proposalID specific deals from proposal id and user id
     * @param userID - The user id of one of the deal's parties
     * @param proposalID - The id of the proposal whose deals are needed
     * @param pagination - pagination details for this query. This function modifies this parameter by setting its nextPageURL field based on whether there
     * is more data left to get or not.
     * @returns A list of settled deal objects.
     */
    public async fetchSettledDealsFromUserProposalIds(userID: number, proposalID: number, pagination: PaginationModel) {

        let offset = pagination.getOffset();

        let rows = await this.databaseManager.select('partnerID', 'ixmDealProposals.proposalID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .join('rtbDeals', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                                             .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                             .whereNot('rtbDeals.status', 'D')
                                             .andWhere('ixmDealProposals.proposalID', proposalID)
                                             .andWhere(function() {
                                                 this.where('ownerID', userID)
                                                     .orWhere('partnerID', userID);
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
        let settledDealArray: SettledDealModel[] = [];

        await Promise.all(rows.map(async (row) => {
            let settledDeal = await this.fetchSettledDealFromIds(proposalID, row.partnerID);

            if (settledDeal) {
                settledDealArray.push(settledDeal);
            }
        }));

        settledDealArray.sort((a, b) => a.id - b.id);

        return settledDealArray;

    }

    public async fetchSettledDealFromPartyIds(proposalID: number, partyID: number, otherPartyID: number) {

        let rows = await this.databaseManager.select('partnerID', 'ixmDealProposals.proposalID')
                                             .from('ixmDealNegotiations')
                                             .join('ixmNegotiationDealMappings', 'ixmDealNegotiations.negotiationID',
                                                   'ixmNegotiationDealMappings.negotiationID')
                                             .join('rtbDeals', 'rtbDeals.dealID', 'ixmNegotiationDealMappings.dealID')
                                             .join('ixmDealProposals', 'ixmDealProposals.proposalID', 'ixmDealNegotiations.proposalID')
                                             .whereNot('rtbDeals.status', 'D')
                                             .andWhere('ixmDealProposals.proposalID', proposalID)
                                             .andWhere(function() {
                                                 this.where('ownerID', otherPartyID)
                                                     .andWhere('partnerID', partyID)
                                                     .orWhere('partnerID', otherPartyID)
                                                     .andWhere('ownerID', partyID);
                                             });

        if (!rows[0]) {
            return;
        }

        let settledDeal = await this.fetchSettledDealFromIds(proposalID, rows[0].partnerID);

        return settledDeal;

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
                                                           settledDeal.negotiatedDeal.partner.company.id,
                                                           settledDeal.negotiatedDeal.proposedDeal.owner.company.id);
        }

        let negotiatedDeal = settledDeal.negotiatedDeal;
        let proposedDeal = negotiatedDeal.proposedDeal;

        // Begin database queries
        await transaction.insert({
            userID: proposedDeal.owner.isBuyer() ? negotiatedDeal.partner.company.id : proposedDeal.owner.company.id,
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
