'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { UserManager } from '../user/user-manager';
import { BuyerModel } from './buyer-model';

const Log: Logger = new Logger('mBYR');

/** Buyer model manager */
class BuyerManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal contact manager */
    private userManager: UserManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.userManager = userManager;
    }

    /**
     * Returns a buyer model from a userID and an optional dspID
     * @param userId - The userID of the buyer we want information from.
     * @returns A promise for a new buyer model.
     */
    public fetchBuyerFromId(id: number): Promise<BuyerModel> {

        let buyerObject = new BuyerModel();

        return this.databaseManager.select('dspID')
                .from('ixmBuyers')
                .where('userID', id)
            .then((rows) => {
                let dsps = rows.map((row) => { return row.dspID; });
                buyerObject.dspIDs = dsps;
                return this.userManager.fetchUserFromId(id);
            })
            .then((userInfo) => {
                buyerObject.userInfo = userInfo;
                buyerObject.userID = id;
                return buyerObject;
            });

    }
}

export { BuyerManager }
