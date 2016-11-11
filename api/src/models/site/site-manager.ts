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
                                             .join('siteCategories', 'siteCategories.siteID', 'sites.siteID')
                                             .join('categories', 'categories.categoryID', 'siteCategories.categoryID')
                                             .where('sites.siteID', siteID);

        if (!rows[0]) {
            return;
        }

        let siteData = rows[0];
        siteData.categories = rows.map((row) => { return row.categories; });

        return new SiteModel(siteData);

    }

    /**
     * k den
     * @param sectionID - The id of the section to find sites for.
     * @returns An array of site models.
     */
    public async fetchSitesFromSectionId(sectionID: number) {

        let rows = await this.databaseManager.select('siteID')
                                             .from('rtbSiteSections')
                                             .where('sectionID', sectionID);

        let sites = [];

        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            sites.push(await this.fetchSiteFromId(row.siteID));
        }

        return sites;

    }

}

export { SiteManager };
