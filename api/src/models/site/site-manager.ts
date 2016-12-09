'use strict';

import { DatabaseManager } from '../../lib/database-manager';
import { SiteModel } from './site-model';
import { Helper } from '../../lib/helper';

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

        return new SiteModel({
            publisherID: rows[0].publisherID,
            id: rows[0].id,
            status: Helper.statusLetterToWord(rows[0].status),
            url: rows[0].url,
            monthlyUniques: rows[0].monthlyUniques,
            name: rows[0].name,
            categories: rows.filter((row) => { return !!row.categories; }).map((row) => { return row.categories; }),
            description: rows[0].description
        });

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

        await Promise.all(rows.map(async (row) => {
            let site = await this.fetchSiteFromId(row.siteID);

            if (!site) {
                return;
            }

            sites.push(site);
        }));

        return sites;

    }

}

export { SiteManager };
