'use strict';

import { DatabaseManager } from '../../lib/database-manager';
import { SiteModel } from './site-model';

class SiteManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     * @param proposedDealManager - An instance of the ProposedDealManager.
     * @param userManager - An instance of the User Manager.
     */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Fetch a site by id.
     * @param siteId - The id of the site to fetch.
     * @returns A site model for the site you wanted.
     */
    public async fetchSiteFromId(siteID: number) {

        let rows = await this.databaseManager.select('userID as publisherID', 'sites.siteID as id', 'sites.status', 'mainDomain as url',
                                                     'monthlyUniques', 'sites.name as name', 'categories.name as categories',
                                                     'description')
                                             .from('sites')
                                             .leftJoin('siteCategories', 'siteCategories.siteID', 'sites.siteID')
                                             .leftJoin('categories', 'categories.categoryID', 'siteCategories.categoryID')
                                             .where('sites.siteID', siteID);

        if (!rows[0]) {
            return;
        }

        let siteData = rows[0];
        siteData.categories = rows.filter((row) => { return !!row.categories; })
                                  .map((row) => { return row.categories; });

        return new SiteModel(siteData);

    }

    /**
     * k den
     * @param sectionID - The id of the section to find sites for.
     * @returns An array of site models.
     */
    public async fetchActiveSitesFromSectionId(sectionID: number) {

        let rows = await this.databaseManager.select('sites.siteID')
                                             .from('rtbSiteSections')
                                             .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                             .where({
                                                 'sectionID': sectionID,
                                                 'sites.status': 'A'
                                             });

        let sites = [];

        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let site = await this.fetchSiteFromId(row.siteID);

            if (!site) {
                continue;
            }

            sites.push(site);
        }

        return sites;

    }

}

export { SiteManager };