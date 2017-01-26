'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../lib/database-manager';
import { DealSectionModel } from './deal-section-model';
import { PaginationModel } from '../pagination/pagination-model';
import { SiteManager } from '../site/site-manager';
import { Helper } from '../../lib/helper';

/** Deal Negotiation model manager */
class DealSectionManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal Site Manager */
    private siteManager: SiteManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param proposedDealManager - An instance of the ProposedDealManager.
     * @param userManager - An instance of the User Manager.
     */
    constructor(databaseManager: DatabaseManager, siteManager: SiteManager) {
        this.databaseManager = databaseManager;
        this.siteManager = siteManager;
    }

    /**
     * Fetch deal section models with pagination and filtering.
     * @param pagination - The pagination to use, this is modified.
     * @param clauses - A collection of where clauses to include.
     * @returns The list of deal sections matching filtering and pagination.
     */
    public async fetchDealSections(pagination: PaginationModel, ...clauses: ((db: knex.QueryBuilder) => any)[]): Promise<DealSectionModel[]> {

        let query = this.databaseManager.select('rtbSections.sectionID as id', 'rtbSections.name', 'rtbSections.status',
                                                'rtbSections.userID as publisherID', 'percent as coverage', 'entireSite',
                                                this.databaseManager.raw(`GROUP_CONCAT(DISTINCT CONCAT_WS(\',\', url, matchType)
                                                                            ORDER BY url, matchType) as urlMatches`),
                                                this.databaseManager.raw(`GROUP_CONCAT(DISTINCT adUnits.name ORDER BY adUnits.name) as adUnitNames`),
                                                this.databaseManager.raw(`GROUP_CONCAT(DISTINCT sectionDAPMappings.segmentID 
                                                                            ORDER BY sectionDAPMappings.segmentID) as segments`),
                                                this.databaseManager.raw(`GROUP_CONCAT(DISTINCT sectionCountryMappings.countryCode 
                                                                            ORDER BY sectionCountryMappings.countryCode) as countries`),
                                                this.databaseManager.raw(`GROUP_CONCAT(DISTINCT rtbDomainDepths.name 
                                                                            ORDER BY rtbDomainDepths.name) as domains`))
                                        .from('rtbSections')
                                        .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                                        .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                        .leftJoin('ixmProposalSectionMappings', 'ixmProposalSectionMappings.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('rtbSectionMatches', 'rtbSectionMatches.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('sectionAdUnitMappings', 'sectionAdUnitMappings.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('adUnits', 'adUnits.adUnitID', 'sectionAdUnitMappings.adUnitID')
                                        .leftJoin('sectionDAPMappings', 'sectionDAPMappings.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('sectionCountryMappings', 'sectionCountryMappings.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('sectionDepthMappings', 'sectionDepthMappings.sectionID', 'rtbSections.sectionID')
                                        .leftJoin('rtbDomainDepths', 'sectionDepthMappings.depthBucket', 'rtbDomainDepths.depthBucket')
                                        .where((db) => { clauses.forEach(filter => filter(db) ); })
                                        .andWhere(function() {
                                            this.whereNull('rtbSectionMatches.sectionID')
                                                .andWhere('rtbSections.entireSite', 1)
                                                .orWhere('rtbSections.entireSite', 0)
                                                .whereNotNull('rtbSectionMatches.sectionID');
                                        })
                                        .groupBy('id');

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

        let dealSections = await Promise.all<DealSectionModel>(rows.map(async (row) => {

            if (!row) {
                return;
            }

            let urlMatches = [];

            if (row.urlMatches) {
                row.urlMatches = row.urlMatches.split(',');

                for (let i = 0; i < row.urlMatches.length; i += 2) {
                    if (row.urlMatches[i]) {
                        urlMatches.push({
                            url: row.urlMatches[i],
                            matchType: Helper.matchTypeToWord(Number(row.urlMatches[i + 1]))
                        });
                    }
                }
            }

            let newDealSection = new DealSectionModel({
                coverage: row.coverage,
                entireSite: !!row.entireSite,
                id: row.id,
                urlMatches: urlMatches,
                name: row.name,
                publisherID: row.publisherID,
                status: Helper.statusLetterToWord(row.status),
                adUnitRestrictions: row.adUnitNames && row.adUnitNames.split(',') || [],
                audienceRestrictions: row.segments && row.segments.split(',') || [],
                countryRestrictions: row.countries && row.countries.split(',') || [],
                frequencyRestrictions: row.domains && row.domains.split(',') || []
            });

            newDealSection.sites = await this.siteManager.fetchSitesFromSectionId(row.id);

            return newDealSection;

        }));

        return dealSections;
    }

    /**
     * Get a deal section by id.
     * @param sectionID - The id of the section you want to retrieve.
     * @returns A settled deal model corresponding to that sectionID.
     */
    public async fetchDealSectionById(sectionID: number) {

        return (await this.fetchDealSections(null,
            (db) => {
                db.where({
                    'rtbSections.sectionID': sectionID
                });
            }
        ))[0];

    }

    /**
     * Get all deal sections specified by id in the array.
     * @param sectionIDs - The ids of the sections you want to retrieve.
     * @returns An array of settled deal models corresponding to the sectionIDs.
     */
    public async fetchDealSectionsByIds(sectionIDs: number[]) {

        return (await this.fetchDealSections(null,
            (db) => {
                db.whereIn('rtbSections.sectionID', sectionIDs);
            }
        ));

    }

    /**
     * Get the active section ids for the proposal
     * @param proposalID - The id of the proposed deal.
     * @returns An array of section ids;
     */
    public async fetchSectionsFromProposalId(proposalID: number) {

        return await this.fetchDealSections(null,
            (db) => {
                db.where({
                    'ixmProposalSectionMappings.proposalID': proposalID
                })
                .andWhere(function() {
                    this.where('adUnits.status', 'A')
                        .orWhereNull('adUnits.status');
                });
            }
        );

    }

    /**
     *  Get all negotiated sections relating to the specified negotiation.
     *  @param negotiationID - the id of the negotiated deal. 
     *  @returns An array of sections.
     */
    public async fetchSectionsFromNegotiationId(negotiationID: number) {

        let dealSectionIds: number[] = [];
        let rows = await this.databaseManager.select('sectionID')
                                             .from('ixmNegotiationSectionMappings')
                                             .where('negotiationID', negotiationID);

        dealSectionIds = rows.map((row) => { return row.sectionID; });

        return await this.fetchDealSectionsByIds(dealSectionIds);

    }

    /**
     * Insert a proposal-section mapping into negotiation by specifying a partnerID
     * @param: negotiationID - id of the negotiation the section is being added to 
     * @param: sectionID - the section to add
     * @param: transaction - knex.Transaction
     */
    public async insertNegotiationSection(negotiationID: number, sectionID: number, transaction?: knex.Transaction) {

        if (!transaction) {
            await this.databaseManager.transaction (async (trx) => {
                await this.insertNegotiationSection(negotiationID, sectionID, trx);
            });
        }

        await transaction.insert({
            negotiationID: negotiationID,
            sectionID: sectionID
            }).into('ixmNegotiationSectionMappings');

    }

    /**
     * Remove sections from a negotiation 
     * @param: negotiationID: the negotiation to remove from 
     * @param: sectionIDs: all the sections to be removed from the negotiation 
     * @param: transaction: knex.Transaction
     */
    public async removeSectionsFromNegotiation(negotiationID: number, sectionIDs: number[], transaction?: knex.Transaction) {

        if (!transaction) {
            await this.databaseManager.transaction (async (trx) => {
                await this.removeSectionsFromNegotiation(negotiationID, sectionIDs, trx);
            });
        }

        await transaction.delete().from('ixmNegotiationSectionMappings')
                                  .whereIn('sectionID', sectionIDs)
                                  .andWhere('negotiationID', negotiationID);

    }

}

export { DealSectionManager };