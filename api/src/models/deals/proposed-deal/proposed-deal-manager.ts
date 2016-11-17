'use strict';

import { DatabaseManager } from '../../../lib/database-manager';
import { ProposedDealModel } from './proposed-deal-model';
import { PaginationModel } from '../../pagination/pagination-model';
import { DealSectionManager } from '../../deal-section/deal-section-manager';
import { UserManager } from '../../user/user-manager';
import { Logger } from '../../../lib/logger';

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

        let proposalInfo = rows[0];
        proposalInfo.sections = await this.dealSectionManager.fetchSectionsFromProposalId(proposalID);
        proposalInfo.ownerInfo = await this.userManager.fetchUserFromId(proposalInfo.ownerID);

        return new ProposedDealModel(proposalInfo);

    }

    /**
     * Get list of objects by status
     * @param proposalStatus - status of the proposal, a enum value which could be active, paused or deleted.
     * @param pagination - The pagination parameters.
     * @returns Returns an array of proposed deal objects with the given status.
     */
    public async fetchProposedDealsFromStatus(proposalStatus: string, pagination: PaginationModel): Promise<ProposedDealModel[]> {

        let offset = pagination.getOffset();

        let proposals = [];
        let rows = await this.databaseManager.select('proposalID')
                                             .from('ixmDealProposals')
                                             .where('status', proposalStatus)
                                             .limit(pagination.limit)
                                             .offset(offset);

        for (let i = 0; i < rows.length; i++) {
            let proposal = await this.fetchProposedDealFromId(rows[i].proposalID);
            proposals.push(proposal);
        }

        return proposals;

    }

    /**
     * Get all proposals
     * @returns Returns an array of proposed deal objects
     */
    public async fetchProposedDeals(pagination: any): Promise<ProposedDealModel[]> {

        let offset = pagination.getOffset();

        let proposals = [];
        let rows = await this.databaseManager.select('proposalID as id')
                                             .from('ixmDealProposals')
                                             .limit(pagination.limit)
                                             .offset(offset);

        for (let i = 0; i < rows.length; i++) {
            let proposal = await this.fetchProposedDealFromId(rows[i].id);
            proposals.push(proposal);
        }

        return proposals;

    }

}

export { ProposedDealManager };
