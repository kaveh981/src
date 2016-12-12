'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { ProposedDealModel } from './proposed-deal-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { UserModel } from '../../user/user-model';
import { UserManager } from '../../user/user-manager';
import { Helper } from '../../../lib/helper';

/** Package model manager */
class ProposedDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** To populate the contact info */
    private userManager: UserManager;

    /** To get deal section info */
    private dealSectionManager: DealSectionManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     * @param userManager - An instance of the user manager.
     */
    constructor(databaseManager: DatabaseManager, userManager: UserManager, dealSectionManager: DealSectionManager) {
        this.databaseManager = databaseManager;
        this.userManager = userManager;
        this.dealSectionManager = dealSectionManager;
    }

    /**
     * Get proposal object by ID
     * @param proposalID - the ID of the proposal
     * @returns Returns a proposed deal object and includes associated section IDs
     */
    public async fetchProposedDealFromId(proposalID: number): Promise<ProposedDealModel> {

        let rows = await this.databaseManager.select('proposalID as id', 'ownerID', 'name', 'description', 'status',
                                                     'startDate', 'endDate', 'price', 'impressions', 'budget',
                                                     'auctionType', 'terms', 'createDate', 'modifyDate')
                                             .from('ixmDealProposals')
                                             .where('proposalID', proposalID);

        if (!rows[0]) {
            return;
        }

        let proposal = new ProposedDealModel({
            id: proposalID,
            ownerID: rows[0].ownerID,
            name: rows[0].name,
            description: rows[0].description,
            status: rows[0].status,
            startDate: Helper.formatDate(rows[0].startDate),
            endDate: Helper.formatDate(rows[0].endDate),
            price: rows[0].price,
            impressions: rows[0].impressions,
            budget: rows[0].budget,
            auctionType: rows[0].auctionType,
            terms: rows[0].terms,
            createDate: rows[0].createDate,
            modifyDate: rows[0].modifyDate,
            currency: 'USD'
        });

        await Promise.all([ (async () => {
            proposal.sections = await this.dealSectionManager.fetchSectionsFromProposalId(proposalID);
        })(), (async () => {
            proposal.ownerInfo = await this.userManager.fetchUserFromId(rows[0].ownerID);
        })(), (async () => {
            proposal.targetedUsers = await this.fetchTargetedBuyerIdsFromProposalId(proposalID);
        })() ]);

        return proposal;

    }

    /**
     * Get list of objects by status
     * @param proposalStatus - status of the proposal, a enum value which could be active, paused or deleted.
     * @param pagination - The pagination parameters.
     * @returns Returns an array of proposed deal objects with the given status.
     */
    public async fetchProposedDealsFromStatus(proposalStatus: string, pagination: PaginationModel): Promise<ProposedDealModel[]> {

        let proposalIDs = await this.databaseManager.pluck('proposalID')
                                         .from('ixmDealProposals')
                                         .where('status', proposalStatus)
                                         .limit(pagination.limit + 1)
                                         .offset(pagination.getOffset());

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (proposalIDs.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            proposalIDs.pop();
        }

        // Fetch the proposals
        let proposals: ProposedDealModel[] = [];

        await Promise.all(proposalIDs.map(async (proposalID) => {

            if (proposalID) {
                proposals.push(await this.fetchProposedDealFromId(proposalID));
            }

        }));

        proposals.sort((a, b) => a.id - b.id);

        return proposals;

    }

    /**
     * Get list of available proposed deals
     * @param pagination - The pagination parameters.
     * @returns Returns an array of available proposed deal objects.
     */
    public async fetchAvailableProposedDealsFromUser(user: UserModel, pagination: PaginationModel): Promise<ProposedDealModel[]> {

        let today = Helper.formatDate(Helper.currentDate());
        let userID = user.id;

        let rows = await this.databaseManager.distinct('ixmDealProposals.proposalID as proposalID')
                                             .select()
                                             .from('ixmDealProposals')
                                             .join('ixmProposalSectionMappings', 'ixmDealProposals.proposalID', 'ixmProposalSectionMappings.proposalID')
                                             .join('rtbSections', 'rtbSections.sectionID', 'ixmProposalSectionMappings.sectionID')
                                             .join('rtbSiteSections', 'rtbSections.sectionID', 'rtbSiteSections.sectionID')
                                             .join('sites', 'rtbSiteSections.siteID', 'sites.siteID')
                                             .join('users', 'users.userID', 'ixmDealProposals.ownerID')
                                             .leftJoin('ixmProposalTargeting', 'ixmDealProposals.proposalID', 'ixmProposalTargeting.proposalID')
                                             .where('ixmDealProposals.status', 'active')
                                             .andWhere('startDate', '<=', 'endDate')
                                             .andWhere(function() {
                                                 this.where('endDate', '>=', today)
                                                     .orWhere('endDate', '0000-00-00');
                                             })
                                             .andWhere('users.status', 'A')
                                             .andWhere('rtbSections.status', 'A')
                                             .andWhere('sites.status', 'A')
                                             .andWhere(function() {
                                                 this.where('ixmProposalTargeting.userID', userID)
                                                     .orWhereNull('ixmProposalTargeting.userID');
                                             })
                                             .orWhere(function() {
                                                 this.where('ownerID', userID)
                                                     .andWhereNot('ixmDealProposals.status', 'deleted');
                                             })
                                             .limit(pagination.limit + 1)
                                             .offset(pagination.getOffset());

        // Check that there is more data to retrieve to appropriately set the next page URL
        if (rows.length <= pagination.limit) {
            pagination.nextPageURL = '';
        } else {
            rows.pop();
        }

        // Fetch the proposals
        let proposals: ProposedDealModel[] = [];

        await Promise.all(rows.map(async (row) => {

            if (row.proposalID) {
                proposals.push(await this.fetchProposedDealFromId(row.proposalID));
            }

        }));

        proposals.sort((a, b) => a.id - b.id);

        return proposals;

    }

    /**
     * Create a new proposed deal from a set of proposal fields.
     * @param proposalFields - The fields used to set the proposal properties
     * @returns A proposed deal model with the specified properties
     */
    public async createProposedDeal(proposalFields: any = {}) {

        // if (proposalFields.contact) {
        //     let name = proposalFields.contact.name;

        //     ownerInfo.emailAddress = proposalFields.contact.email;
        //     ownerInfo.phone = proposalFields.contact.phone;
        //     ownerInfo.title = proposalFields.contact.title;
        //     ownerInfo.firstName = name.substr(0, name.indexOf(' '));
        //     ownerInfo.lastName = proposalFields.contact.name.substr(name.indexOf(' ') + 1);
        // }

        let proposedDeal = new ProposedDealModel({
            ownerID: proposalFields.ownerID,
            ownerInfo: proposalFields.ownerInfo,
            name: proposalFields.name,
            description: proposalFields.description,
            status: 'active',
            startDate: proposalFields.startDate,
            endDate: proposalFields.endDate,
            price: proposalFields.price,
            impressions: proposalFields.impressions,
            budget: proposalFields.budget,
            auctionType: proposalFields.auctionType,
            terms: proposalFields.terms,
            createDate: Helper.currentDate(),
            modifyDate: Helper.currentDate(),
            sections: proposalFields.inventory,
            targetedUsers: proposalFields.partners
        });

        return proposedDeal;

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

        // Insert proposal into ixmDealProposals
        let proposalID = (await transaction.insert({
            ownerID: proposedDeal.ownerID,
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
        }).into('ixmDealProposals').returning('proposalID'))[0];

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
                                                    .from('ixmDealProposals')
                                                    .where('proposalID', proposalID))[0].modifyDate;

    }

    /**
     * Update a proposal with new parameters sent in the request and update new modifyDate
     * @param proposedDeal - The proposaled deal deal to update.
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

        await transaction.from('ixmDealProposals').update({
            proposalID: proposedDeal.id,
            ownerID: proposedDeal.ownerID,
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
                                                .from('ixmDealProposals')
                                                .where('proposalID', proposedDeal.id))[0];

        proposedDeal.modifyDate = updatedProposal.modifyDate;

    }

    /** 
     * Get a list of userIDs that are targeted by a proposal
     * @param proposalID - the id of the proposal targeted towards buyers 
     * @return An array of buyerIDs targeted by the proposalID specified (if any)
     */
    private async fetchTargetedBuyerIdsFromProposalId(proposalID: number): Promise<number[]> {

        return await this.databaseManager.pluck('userID')
                                         .from('ixmProposalTargeting')
                                         .where('proposalID', proposalID);

    }

}

export { ProposedDealManager };
