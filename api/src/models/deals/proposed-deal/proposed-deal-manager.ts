'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { ProposedDealModel } from './proposed-deal-model';
import { MarketUserModel } from '../../market-user/market-user-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { MarketUserManager } from '../../market-user/market-user-manager';
import { Helper } from '../../../lib/helper';

/** Package model manager */
class ProposedDealManager {

    private readonly filterMapping = {
        owner_id: {
            table: 'ixmProposals',
            operator: '=',
            column: 'ownerID'
        }
    };

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** A market user manager */
    private marketUserManager: MarketUserManager;

    /** To get deal section info */
    private dealSectionManager: DealSectionManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     * @param userManager - An instance of the user manager.
     */
    constructor(databaseManager: DatabaseManager, marketUserManager: MarketUserManager, dealSectionManager: DealSectionManager) {
        this.databaseManager = databaseManager;
        this.marketUserManager = marketUserManager;
        this.dealSectionManager = dealSectionManager;
    }

    /**
     * Fetch proposed deal models with pagination and filtering.
     * @param pagination - The pagination to use, this is modified.
     * @param clauses - A collection of where clauses to include.
     * @returns The list of proposed deals matching filtering and pagination.
     */
    public async fetchProposedDeals(pagination: PaginationModel, ...clauses: ((db: knex.QueryBuilder) => any)[]) {

        let query = this.databaseManager.distinct('ixmProposals.proposalID', 'ownerID', 'ownerContactID', 'ixmProposals.name',
                                                'ixmProposals.description', 'ixmProposals.status', 'startDate', 'endDate', 'price',
                                                'impressions', 'budget', 'auctionType', 'terms', 'ixmProposals.createDate',
                                                'ixmProposals.modifyDate')
                                        .from('ixmProposals')
                                        .leftJoin('ixmProposalSectionMappings', 'ixmProposals.proposalID', 'ixmProposalSectionMappings.proposalID')
                                        .leftJoin('rtbSections', 'rtbSections.sectionID', 'ixmProposalSectionMappings.sectionID')
                                        .leftJoin('rtbSiteSections', 'rtbSections.sectionID', 'rtbSiteSections.sectionID')
                                        .leftJoin('sites', 'rtbSiteSections.siteID', 'sites.siteID')
                                        .join('users as owner', 'owner.userID', 'ixmProposals.ownerID')
                                        .join('users as contact', 'contact.userID', 'ixmProposals.ownerContactID')
                                        .leftJoin('ixmProposalTargeting', 'ixmProposals.proposalID', 'ixmProposalTargeting.proposalID')
                                        .where((db) => { clauses.forEach(filter => filter(db) ); });

        if (pagination) {
            query.limit(pagination.limit + 1).offset(pagination.getOffset());
        }

        let rows = await query;

        if (pagination) {
            if (rows.length <= pagination.limit) {
                pagination.nextPageURL = '';
            } else {
                rows.pop();
            }
        }

        let proposals: ProposedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {

            let proposal = new ProposedDealModel({
                id: row.proposalID,
                name: row.name,
                description: row.description,
                status: row.status,
                startDate: Helper.formatDate(row.startDate),
                endDate: Helper.formatDate(row.endDate),
                price: row.price,
                impressions: row.impressions,
                budget: row.budget,
                auctionType: row.auctionType,
                terms: row.terms,
                createDate: row.createDate,
                modifyDate: row.modifyDate,
                currency: 'USD'
            });

            let extraInfo = await Promise.parallel({
                sections: this.dealSectionManager.fetchSectionsFromProposalId(row.proposalID),
                owner: this.marketUserManager.fetchMarketUserFromId(row.ownerContactID),
                targets: this.fetchTargetedIdsFromProposalId(row.proposalID)
            });

            proposal.sections = extraInfo.sections;
            proposal.owner = extraInfo.owner;
            proposal.targetedUsers = extraInfo.targets;

            proposals.push(proposal);

        }));

        proposals.sort((a, b) => a.id - b.id);

        return proposals;

    }

    /**
     * Get proposal object by ID
     * @param proposalID - the ID of the proposal
     * @returns Returns a proposed deal object and includes associated section IDs
     */
    public async fetchProposedDealFromId(proposalID: number) {
        return (await this.fetchProposedDeals(null, (db) => { db.where('ixmProposals.proposalID', proposalID); }))[0];
    }

    /** 
     * Fetch targeted proposals for a user
     * @param user - The market user to find targeted deals.
     * @param pagination - The pagination to use, this is modified.
     * @returns The proposals targeted at the user.
     */
    public async fetchTargetedProposedDealsForUser(user: MarketUserModel, pagination: PaginationModel, filters: any) {

        let dbFiltering = this.databaseManager.createFilter(filters, this.filterMapping);

        return await this.fetchProposedDeals(pagination, dbFiltering,
            (db) => {
                db.where('ixmProposalTargeting.userID', user.company.id);
            },
            (db) => {
                db.where('ixmProposals.status', 'active')
                .andWhere('startDate', '<=', 'endDate')
                .andWhere('owner.status', 'A');
            });

    }

    public async fetchProposedDealsOwnedByUser(user: MarketUserModel, pagination: PaginationModel, filters: any) {

        let dbFiltering = this.databaseManager.createFilter(filters, this.filterMapping);

        return await this.fetchProposedDeals(pagination, dbFiltering,
            (db) => {
                db.where('ixmProposals.ownerID', user.company.id)
                  .whereNot('ixmProposals.status', 'deleted');
            });

    }

    /**
     * Get list of available proposed deals
     * @param pagination - The pagination parameters. This function modifies this parameter by setting its nextPageURL field based on whether there is more
     * data left to get or not.
     * @returns Returns an array of available proposed deal objects.
     */
    public async fetchAvailableProposedDeals(pagination: PaginationModel, filters: {[s: string]: any}) {

        let today = Helper.formatDate(Helper.currentDate());
        let dbFiltering = this.databaseManager.createFilter(filters, this.filterMapping);

        return await this.fetchProposedDeals(pagination, dbFiltering, (db) => {
            db.where('ixmProposals.status', 'active')
              .andWhere('startDate', '<=', 'endDate')
              .andWhere(function() {
                  this.where('endDate', '>=', today)
                      .orWhere('endDate', '0000-00-00');
              })
              .andWhere('owner.status', 'A')
              .andWhere('rtbSections.status', 'A')
              .andWhere('sites.status', 'A')
              .andWhere('ixmProposalTargeting.userID', null);
        });

    }

    /**
     * Insert a new proposed deal into the database.
     * @param proposedDeal - The proposed deal to insert
     * @param transaction - A knex transaction object to use.
     */
    public async insertProposedDeal(proposedDeal: ProposedDealModel, transaction?: knex.Transaction) {

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertProposedDeal(proposedDeal, trx);
            });
            return;
        }

        // Insert proposal into ixmProposals
        let proposalID = (await transaction.insert({
            ownerID: proposedDeal.owner.company.id,
            ownerContactID: proposedDeal.owner.contact.id,
            name: proposedDeal.name,
            description: proposedDeal.description,
            status: 'active',
            startDate: proposedDeal.startDate,
            endDate: proposedDeal.endDate,
            price: proposedDeal.price,
            impressions: proposedDeal.impressions,
            budget: proposedDeal.budget,
            auctionType: proposedDeal.auctionType,
            terms: proposedDeal.terms,
            createDate: proposedDeal.createDate,
            modifyDate: proposedDeal.modifyDate
        }).into('ixmProposals').returning('proposalID'))[0];

        // Insert proposal sections mappings into ixmProposalSectionMappings
        if (proposedDeal.sections.length > 0) {

            let proposalSectionMappings = [];

            for (let i = 0; i < proposedDeal.sections.length; i++) {
                proposalSectionMappings.push({
                    proposalID: proposalID,
                    sectionID: proposedDeal.sections[i].id
                });
            }

            await transaction.insert(proposalSectionMappings).into('ixmProposalSectionMappings');

        }

        // If proposal is targeted, insert proposal target mappings into ixmProposalTargeting
        if (proposedDeal.targetedUsers.length > 0) {

            let proposalTargetMappings = [];

            for (let i = 0; i < proposedDeal.targetedUsers.length; i++) {
                proposalTargetMappings.push({
                    proposalID: proposalID,
                    userID: proposedDeal.targetedUsers[i]
                });
            }

            await transaction.insert(proposalTargetMappings).into('ixmProposalTargeting');

        }

        proposedDeal.id = proposalID;
        proposedDeal.modifyDate = (await transaction.select('modifyDate')
                                                    .from('ixmProposals')
                                                    .where('proposalID', proposalID))[0].modifyDate;

    }

    /**
     * Update a proposal with new parameters sent in the request and update new modifyDate
     * @param proposedDeal - The proposal to update.
     * @param transaction - An optional transaction to use. 
     */
    public async updateProposedDeal(proposedDeal: ProposedDealModel, transaction?: knex.Transaction) {

        if (!proposedDeal.id) {
            throw new Error('Cannot update a proposed deal without an id.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.updateProposedDeal(proposedDeal, trx);
            });
            return;
        }

        await transaction.from('ixmProposals').update({
            proposalID: proposedDeal.id,
            ownerID: proposedDeal.owner.company.id,
            ownerContactID: proposedDeal.owner.contact.id,
            name: proposedDeal.name,
            description: proposedDeal.description,
            status: proposedDeal.status,
            startDate: proposedDeal.startDate,
            endDate: proposedDeal.endDate,
            price: proposedDeal.price,
            budget: proposedDeal.budget,
            impressions: proposedDeal.impressions,
            auctionType: proposedDeal.auctionType,
            terms: proposedDeal.terms,
            createDate: proposedDeal.createDate
        }).where('proposalID', proposedDeal.id);

        let updatedProposal = (await transaction.select('modifyDate')
                                                .from('ixmProposals')
                                                .where('proposalID', proposedDeal.id))[0];

        proposedDeal.modifyDate = updatedProposal.modifyDate;

    }

    /** 
     * Get a list of userIDs that are targeted by a proposal
     * @param proposalID - the id of the proposal targeted towards buyers 
     * @return An array of buyerIDs targeted by the proposalID specified (if any)
     */
    private async fetchTargetedIdsFromProposalId(proposalID: number): Promise<number[]> {
        return await this.databaseManager.pluck('userID').from('ixmProposalTargeting').where('proposalID', proposalID);
    }

}

export { ProposedDealManager };
