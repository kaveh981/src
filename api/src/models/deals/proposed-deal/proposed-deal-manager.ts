'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../../lib/database-manager';
import { Logger } from '../../../lib/logger';
import { ProposedDealModel } from './proposed-deal-model';
import { UserManager } from '../../user/user-manager';

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
     * Get package object by ID
     * @param proposalID - the ID of the package
     * @returns Returns a proposed deal object and includes associated section IDs
     */
    public fetchProposedDealFromId = Promise.coroutine(function* (proposalID: number) {

        let rows = yield this.databaseManager.select('ixmPackages.packageID as id', 'ownerID', 'name', 'description', 'status',
                    'accessMode', 'startDate', 'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms',
                    'createDate', 'modifyDate', 'sectionID')
                .from('ixmPackages')
                .join('ixmPackageSectionMappings', 'ixmPackages.packageID', 'ixmPackageSectionMappings.packageID')
                .limit(1)
                .where('ixmPackages.packageID', proposalID);

        if (!rows[0]) {
            return;
        }

        let proposalInfo = rows[0];
        proposalInfo.sections = yield this.fetchSectionsFromProposalId(proposalID);
        proposalInfo.ownerInfo = yield this.userManager.fetchUserFromId(proposalInfo.ownerID);

        return new ProposedDealModel(proposalInfo);

    }.bind(this)) as (proposalID: number) => Promise<ProposedDealModel>;

    /**
     * Get list of objects by status
     * @param proposalStatus - status of the package, a enum value which could be active, paused or deleted.
     * @param pagination - The pagination parameters.
     * @returns Returns an array of proposed deal objects with the given status.
     */
    public fetchProposedDealsFromStatus(proposalStatus: string, pagination: any): Promise<ProposedDealModel[]> {

        return this.databaseManager.select('packageID')
                .from('ixmPackages')
                .where('status', proposalStatus)
                .limit(Number(pagination.limit))
                .offset(Number(pagination.offset))
            .then((idObjects: any) => {
                return Promise.map(idObjects, (idObject: any) => {
                    return this.fetchProposedDealFromId(idObject.packageID);
                });
            });

    }

    /** 
     * Get the active section ids for the proposal
     * @param proposalID - The id of the proposed deal.
     * @returns An array of section ids;
     */
    public fetchSectionsFromProposalId(proposalID: number): Promise<string[]> {

        return this.databaseManager.select('ixmPackageSectionMappings.sectionID as id')
                .from('ixmPackageSectionMappings')
                .join('rtbSections', 'ixmPackageSectionMappings.sectionID', 'rtbSections.sectionID')
                .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                .where('ixmPackageSectionMappings.packageID', proposalID)
                .andWhere('rtbSections.status', 'A')
                .andWhere('sites.status', 'A')
                .groupBy('id')
            .then((rows) => {
                return rows.map((row) => { return row.id; });
            });

    }
}

export { ProposedDealManager };
