'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../lib/database-manager';
import { DealSectionModel } from './deal-section-model';
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

    public async fetchDealSections(...clauses: ((db: knex.QueryBuilder) => any)[]) {
        // TODO
    }

    /**
     * Get a deal section by id.
     * @param sectionID - The id of the section you want to retrieve.
     * @returns A settled deal model corresponding to that sectionID.
     */
    public async fetchDealSectionById(sectionID: number) {

        let rows = await this.databaseManager.select('rtbSections.sectionID as id', 'name', 'status', 'percent as coverage',
                                                     'entireSite', 'url', 'matchType', 'userID as publisherID')
                                             .from('rtbSections')
                                             .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('rtbSectionMatches', 'rtbSectionMatches.sectionID', 'rtbSections.sectionID')
                                             .where('rtbSections.sectionID', sectionID)
                                             .andWhere(function() {
                                                  this.whereNull('rtbSectionMatches.sectionID')
                                                      .andWhere('rtbSections.entireSite', 1)
                                                      .orWhere('rtbSections.entireSite', 0)
                                                      .whereNotNull('rtbSectionMatches.sectionID');
                                             });

        if (!rows[0]) {
            return;
        }

        let newDealSection = new DealSectionModel({
            coverage: rows[0].coverage,
            entireSite: !!rows[0].entireSite,
            id: rows[0].id,
            urlMatches: rows.filter((row) => { return !!row.matchType; }).map((row) => {
                return {
                    matchType: Helper.matchTypeToWord(row.matchType),
                    url: row.url
                };
            }),
            name: rows[0].name,
            publisherID: rows[0].publisherID,
            status: Helper.statusLetterToWord(rows[0].status)
        });

        await Promise.all([ (async () => {
            newDealSection.adUnitRestrictions = await this.fetchAdUnitsBySectionId(sectionID);
        })(), (async () => {
            newDealSection.audienceRestrictions = await this.fetchAudienceRestrictionsBySectionId(sectionID);
        })(), (async () => {
            newDealSection.countryRestrictions = await this.fetchCountryRestrictionBySectionId(sectionID);
        })(), (async () => {
            newDealSection.sites = await this.siteManager.fetchActiveSitesFromSectionId(sectionID);
        })(), (async () => {
            newDealSection.frequencyRestrictions = await this.fetchFrequencyRestrictionsFromSectionId(sectionID);
        })() ]);

        return newDealSection;

    }

    /**
     * Get the active section ids for the proposal
     * @param proposalID - The id of the proposed deal.
     * @returns An array of section ids;
     */
    public async fetchSectionsFromProposalId(proposalID: number) {

        let rows = await this.databaseManager.select('rtbSections.sectionID as id', 'rtbSections.name', 'rtbSections.status',
                                                     'rtbSections.userID as publisherID', 'percent as coverage', 'entireSite',
                                                     this.databaseManager.raw('GROUP_CONCAT(DISTINCT CONCAT_WS(\',\', url, matchType)) as urlMatches'),
                                                     this.databaseManager.raw('GROUP_CONCAT(DISTINCT adUnits.name) as adUnitNames'),
                                                     this.databaseManager.raw('GROUP_CONCAT(DISTINCT sectionDAPMappings.segmentID) as segments'),
                                                     this.databaseManager.raw('GROUP_CONCAT(DISTINCT sectionCountryMappings.countryCode) as countries'),
                                                     this.databaseManager.raw('GROUP_CONCAT(DISTINCT rtbDomainDepths.name) as domains'))
                                             .from('rtbSections')
                                             .join('ixmProposalSectionMappings', 'ixmProposalSectionMappings.sectionID', 'rtbSections.sectionID')
                                             .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                                             .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                             .leftJoin('rtbSectionMatches', 'rtbSectionMatches.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('sectionAdUnitMappings', 'sectionAdUnitMappings.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('adUnits', 'adUnits.adUnitID', 'sectionAdUnitMappings.adUnitID')
                                             .leftJoin('sectionDAPMappings', 'sectionDAPMappings.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('sectionCountryMappings', 'sectionCountryMappings.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('sectionDepthMappings', 'sectionDepthMappings.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('rtbDomainDepths', 'sectionDepthMappings.depthBucket', 'rtbDomainDepths.depthBucket')
                                             .where({
                                                 'ixmProposalSectionMappings.proposalID': proposalID,
                                                 'rtbSections.status': 'A',
                                                 'sites.status': 'A'
                                              })
                                             .andWhere(function() {
                                                  this.whereNull('rtbSectionMatches.sectionID')
                                                      .andWhere('rtbSections.entireSite', 1)
                                                      .orWhere('rtbSections.entireSite', 0)
                                                      .whereNotNull('rtbSectionMatches.sectionID');
                                             })
                                             .andWhere(function() {
                                                 this.where('adUnits.status', 'A')
                                                     .orWhereNull('adUnits.status');
                                             })
                                             .groupBy('id');

        if (!rows[0]) {
            return;
        }

        let dealSections: DealSectionModel[] = [];

        await Promise.all(rows.map(async (row) => {

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

            if (row.adUnitNames) {
                row.adUnitNames = row.adUnitNames.split(',');
            }

            if (row.segments) {
                row.segments = row.segments.split(',');
            }

            if (row.countries) {
                row.countries = row.countries.split(',');
            }

            if (row.domains) {
                row.domains = row.domains.split(',');
            }

            let newDealSection = new DealSectionModel({
                coverage: row.coverage,
                entireSite: !!row.entireSite,
                id: row.id,
                urlMatches: urlMatches,
                name: row.name,
                publisherID: row.publisherID,
                status: Helper.statusLetterToWord(row.status),
                adUnitRestrictions: row.adUnitNames,
                audienceRestrictions: row.segments,
                countryRestrictions: row.countries,
                frequencyRestrictions: row.domains
            });

            newDealSection.sites = await this.siteManager.fetchActiveSitesFromSectionId(row.id);

            dealSections.push(newDealSection);

        }));

        return dealSections;

    }

    /**
     * Fetch the adunits belonging to a section.
     * @param sectionID - The section to find ad-units for.
     * @returns An array of names of the ad units.
     */
    private async fetchAdUnitsBySectionId(sectionID: number) {

        let rows = await this.databaseManager.select('adUnits.name as name')
                                             .from('adUnits')
                                             .join('sectionAdUnitMappings', 'sectionAdUnitMappings.adUnitID', 'adUnits.adUnitID')
                                             .where({
                                                 'sectionID': sectionID,
                                                 'adUnits.status': 'A'
                                             });

        return rows.map((row) => { return row.name; });

    }

    /**
     * Fetch the audience restrictions for a section
     * @param sectionID - The section to find audience restrictions for
     * @returns An array of segment IDs corresponding to the audience restrictions.
     */
    private async fetchAudienceRestrictionsBySectionId(sectionID: number) {

        let rows = await this.databaseManager.select('segmentID')
                                             .from('sectionDAPMappings')
                                             .where('sectionID', sectionID);

        return rows.map((row) => { return row.segmentID; });
    }

    /**
     * Fetch the country restrictions for a section
     * @param sectionID - The section to find the country restrictions for.
     * @returns An array of country codes.
     */
    private async fetchCountryRestrictionBySectionId(sectionID: number) {

        let rows = await this.databaseManager.select('countryCode')
                                             .from('sectionCountryMappings')
                                             .where('sectionID', sectionID);

        return rows.map((row) => { return row.countryCode; });

    }

    /**
     * Get the frequency restrictions for the section.
     * @param sectionID - The section to find the frequency restrictions for.
     * @returns An array of frequency restrictions.
     */
    private async fetchFrequencyRestrictionsFromSectionId(sectionID: number) {

        let rows = await this.databaseManager.select('name')
                                             .from('rtbDomainDepths')
                                             .join('sectionDepthMappings', 'sectionDepthMappings.depthBucket',
                                                   'rtbDomainDepths.depthBucket')
                                             .where('sectionID', sectionID);

        return rows.map((row) => { return row.name; });

    }

}

export { DealSectionManager };
