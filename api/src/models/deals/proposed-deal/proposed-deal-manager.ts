'use strict';

import { DatabaseManager } from '../../../lib/database-manager';
import { ProposedDealModel } from './proposed-deal-model';
import { UserManager } from '../../user/user-manager';
import { Logger } from '../../../lib/logger';

const Log = new Logger('MODS');

/** Package model manager */
class ProposedDealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** To populate the contact info */
    private userManager: UserManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     * @param userManager - An instance of the user manager.
     */
    constructor(databaseManager: DatabaseManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.userManager = userManager;
    }

    /**
     * Get proposal object by ID
     * @param proposalID - the ID of the proposal
     * @returns Returns a proposed deal object and includes associated section IDs
     */
    public async fetchProposedDealFromId(proposalID: number): Promise<ProposedDealModel> {

        let rows = await this.databaseManager.select('proposalID as id', 'ownerID', 'name', 'description', 'status',
                                                     'accessMode', 'startDate', 'endDate', 'price', 'impressions',
                                                     'budget', 'auctionType', 'terms', 'createDate', 'modifyDate')
                                             .from('ixmDealProposals')
                                             .where('proposalID', proposalID);

        if (!rows[0]) {
            return;
        }

        let proposalInfo = rows[0];
        proposalInfo.sections = await this.fetchSectionsFromProposalId(proposalID);
        proposalInfo.ownerInfo = await this.userManager.fetchUserFromId(proposalInfo.ownerID);

        return new ProposedDealModel(proposalInfo);

    }

    /**
     * Get list of objects by status
     * @param proposalStatus - status of the proposal, a enum value which could be active, paused or deleted.
     * @param pagination - The pagination parameters.
     * @returns Returns an array of proposed deal objects with the given status.
     */
    public async fetchProposedDealsFromStatus(proposalStatus: string, pagination: any): Promise<ProposedDealModel[]> {

        let proposals = [];
        let rows = await this.databaseManager.select('proposalID')
                                             .from('ixmDealProposals')
                                             .where('status', proposalStatus)
                                             .limit(pagination.limit)
                                             .offset(pagination.offset);

        for (let i = 0; i < rows.length; i++) {
            let proposal = await this.fetchProposedDealFromId(rows[i].proposalID);
            proposals.push(proposal);
        }

        return proposals;

    }

    /**
     * Get the active section ids for the proposal
     * @param proposalID - The id of the proposed deal.
     * @returns An array of section ids;
     */
    public async fetchSectionsFromProposalId(proposalID: number): Promise<string[]> {

        let rows = await this.databaseManager.select('ixmProposalSectionMappings.sectionID as id')
                                             .from('ixmProposalSectionMappings')
                                             .join('rtbSections', 'ixmProposalSectionMappings.sectionID', 'rtbSections.sectionID')
                                             .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                                             .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                             .where('ixmProposalSectionMappings.proposalID', proposalID)
                                             .andWhere('rtbSections.status', 'A')
                                             .andWhere('sites.status', 'A')
                                             .groupBy('id');

        return rows.map((row) => { return row.id; });

    }
}

export { ProposedDealManager };
