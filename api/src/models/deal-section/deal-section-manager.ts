'use strict';

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

    /**
     * Get a deal section by id.
     * @param sectionID - The id of the section you want to retrieve.
     * @returns A settled deal model corresponding to that sectionID.
     */
    public async fetchDealSectionById(sectionID: number) {

        let rows = await this.databaseManager.select('rtbSections.sectionID as id', 'name', 'status', 'percent as coverage',
                                                     'entireSite', 'url', 'matchType', 'userID as publisherID')
                                             .from('rtbSections')
                                             .leftJoin('rtbSectionMatches', 'rtbSectionMatches.sectionID', 'rtbSections.sectionID')
                                             .where('rtbSections.sectionID', sectionID);

        if (!rows[0]) {
            return;
        }

        let newDealSection = new DealSectionModel({
            adUnitRestrictions: await this.fetchAdUnitsBySectionId(sectionID),
            countryRestrictions: await this.fetchCountryRestrictionBySectionId(sectionID),
            sites: await this.siteManager.fetchSitesFromSectionId(sectionID),
            frequencyRestrictions: await this.fetchFrequencyRestrictionsFromSectionId(sectionID),
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

        return newDealSection;

    }

    /**
     * Get the active section ids for the proposal
     * @param proposalID - The id of the proposed deal.
     * @returns An array of section ids;
     */
    public async fetchSectionsFromProposalId(proposalID: number) {
        let dealSections: DealSectionModel[] = [];
        let rows = await this.databaseManager.select('ixmProposalSectionMappings.sectionID as id')
                                             .from('ixmProposalSectionMappings')
                                             .join('rtbSections', 'ixmProposalSectionMappings.sectionID', 'rtbSections.sectionID')
                                             .leftJoin('rtbSectionMatches', 'rtbSectionMatches.sectionID', 'rtbSections.sectionID')
                                             .join('rtbSiteSections', 'rtbSiteSections.sectionID', 'rtbSections.sectionID')
                                             .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                             .andWhere({
                                                 'ixmProposalSectionMappings.proposalID': proposalID,
                                                 'rtbSections.status': 'A',
                                                 'sites.status': 'A'
                                              })
                                             .whereRaw('((rtbSections.entireSite = 1 AND rtbSectionMatches.sectionID IS null) \
                                                OR (rtbSections.entireSite = 0 AND rtbSectionMatches.sectionID IS NOT null))')
                                             .groupBy('id');

        for (let i = 0; i < rows.length; i++) {
            let section = await this.fetchDealSectionById(rows[i].id);

            if (!section) {
                continue;
            }

            dealSections.push(section);
        }

        return dealSections;

    }

    /**
     * Fetch the adunits belonging to a section.
     * @param sectionID - The section to find ad-units for.
     * @return An array of names of the ad units.
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
