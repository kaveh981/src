'use strict';

import * as Promise from 'bluebird';

import { DealModel } from './deal-model';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mDL');

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
                deal[0].sections = deal[0].sections.split(',');
                return new DealModel(deal[0]);
            })
            .catch((err: Error) => {
                Log.error(err);
            });
    }
}

export { DealManager };
