'use strict';

import * as Promise from 'bluebird';

import { DealModel } from './deal-model';

import { DatabaseManager } from '../../lib/database-manager';
import { PackageManager } from '../../models/package/package-manager';
import { ContactManager } from '../../models/contact-info/contact-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mDLS');

/** Deal model manager */
class DealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal package manager */
    private packageManager: PackageManager;

    /** Internal contact manager */
    private contactManager: ContactManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager, packageManager: PackageManager, contactManager: ContactManager) {
        this.databaseManager = databaseManager;
        this.packageManager = packageManager;
        this.contactManager = contactManager;
    }

    /**
     * Returns a deal model from an id
     * @param id - The id of the deal we want information from.
     */
    public fetchDealFromId(id: number): Promise<DealModel> {
        let deal: DealModel;

        return this.databaseManager.select('dealID as id', 'userID as publisherID', 'dspID as dspId',
                    'name', 'auctionType', 'status', 'startDate', 'endDate', 'externalDealID as externalId',
                    this.databaseManager.raw('GROUP_CONCAT(sectionID) as sections') )
                .from('rtbDeals')
                .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                .where('dealID', id)
                .groupBy('dealID')
            .then((deals: any) => {
                deals[0].sections = deals[0].sections.split(',');
                deal = new DealModel(deals[0]);
                return deal.publisherID;
            })
            .then(this.contactManager.fetchContactInfoFromId)
            .then((contactInfo) => {
                deal.publisherContact = contactInfo;
                return deal;
            })
            .catch((err: Error) => {
                throw err;
            });
    }

    /**
     * Returns all active deals for a certain buyer 
     * @param buyerId - The id of the buyer we need to find active deals for
     * @param pagination - Pagination details for the request
     */
    public fetchActiveDealsFromBuyerId(buyerID: number, pagination: any): Promise<any> {
        /* TODO: This select statement will need to obtain information that was accepted by both the pub and buyer (i.e. latest
            terms, impressions, start and end dates, etc.). Therefore, it will have to interact with the DealNegotiations table 
            to get that info (i.e. get the info from the row that indicates a pubStatus=accepted and buyerStatus=accepted and 
            which has the latest modified date).*/
        return this.databaseManager.select('rtbDeals.dealID', 'ixmPackages.packageID', 'ixmPackages.ownerID', 'rtbDeals.externalDealID',
                    'rtbDeals.name', 'ixmPackages.description', 'rtbDeals.startDate', 'rtbDeals.endDate', 'ixmPackages.price',
                    'ixmPackages.impressions', 'ixmPackages.budget', 'rtbDeals.auctionType', 'ixmPackages.terms', 'rtbDeals.modifiedDate')
                .from('rtbDeals')
                .join('ixmPackageDealMappings', 'rtbDeals.dealID', 'ixmPackageDealMappings.dealID')
                .join('ixmPackages', 'ixmPackageDealMappings.packageID', 'ixmPackages.packageID')
                .where('rtbDeals.status', 'A')
                .andWhere('dspID', buyerID)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .then((deals: any) => {
                return Promise.map(deals, (deal: any) => {
                    return this.packageManager.fetchPackageFromId(deal.packageID)
                        .then((fetchedPackage) => {
                            return Object.assign(deal, {sections: fetchedPackage.sections});
                        });
                });
            })
            .catch((err: Error) => {
                throw err;
            });
    }
}

export { DealManager };
