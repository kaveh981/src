'use strict';

import * as Promise from 'bluebird';

import { DealModel } from './deal-model';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mDLS');

/** Deal model manager */
class DealManager {

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager) {
        this.dbm = database;
    }

    /**
     * Returns a deal model from an id
     * @param id - The id of the deal we want information from.
     */
    public fetchDealFromId(id: number): Promise<DealModel> {
        return this.dbm.select('dealID as id', 'userID as publisherID', 'dspID as dspId',
                                'name', 'auctionType', 'status', 'startDate', 'endDate', 'externalDealID as externalId',
                                this.dbm.raw('GROUP_CONCAT(sectionID) as sections') )
                .from('rtbDeals')
                .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                .where('dealID', id)
                .groupBy('dealID')
            .then((deals: any) => {
                deals[0].sections = deals[0].sections.split(',');
                return new DealModel(deals[0]);
            })
            .catch((err: Error) => {
                Log.error(err);
            });
    }

    /**
     * Returns all active deals for a certain buyer 
     * @param buyerId - The id of the buyer we need to find active deals for
     * @param pagination - Pagination details for the request
     */
    public fetchActiveDealsForBuyer(buyerId: number, pagination: any): Promise<any> {
        /* TODO: This select statement will need to obtain information that was accepted by both the pub and buyer (i.e. latest
            terms, impressions, start and end dates, etc.). Therefore, it will have to interact with the DealNegotiations table 
            to get that info (i.e. get the info from the row that indicates a pubStatus=accepted and buyerStatus=accepted and 
            which has the latest modified date).*/
        return this.dbm.select('rtbDeals.dealID')
                .from('rtbDeals')
                .join('ixmPackageDealMappings', 'rtbDeals.dealID', 'ixmPackageDealMappings.dealID')
                .join('ixmPackages', 'ixmPackageDealMappings.packageID', 'ixmPackages.packageID')
                .where('rtbDeals.status', 'A')
                .andWhere('dspID', buyerId)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .then((deals) => {
                return deals.map((deal) => {return new DealModel(deal); });
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }
}

export { DealManager };
