'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../../lib/database-manager';
import { ProposedDealModel } from './proposed-deal-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { UserManager } from '../../user/user-manager';
import { Logger } from '../../../lib/logger';
import { Helper } from '../../../lib/helper';

const Log = new Logger('MODS');

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
            currency: 'USD',
            sections: await this.dealSectionManager.fetchSectionsFromProposalId(proposalID),
            ownerInfo: await this.userManager.fetchUserFromId(rows[0].ownerID),
            targetedUsers: await this.fetchTargetedBuyerIdsFromProposalId(proposalID)
        });

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
                                         .limit(pagination.limit)
                                         .offset(pagination.getOffset());

        let proposals: ProposedDealModel[] = [];

        for (let i = 0; i < proposalIDs.length; i++) {
            proposals.push(await this.fetchProposedDealFromId(proposalIDs[i]));
        }

        return proposals;

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
            createDate: proposedDeal.createDate,
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
