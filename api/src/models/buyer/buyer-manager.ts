'use strict';

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
    public async fetchBuyerFromId(userID: number): Promise<BuyerModel> {

        let rows = await this.databaseManager.select('dspID').from('ixmBuyers').where('userID', userID);
        let dsps = rows.map((row) => { return row.dspID; });
        let userInfo = await this.userManager.fetchUserFromId(userID);

        if (!userInfo || !rows[0]) {
            return;
        }

        return new BuyerModel({
            dspIDs: dsps,
            userInfo: userInfo,
            userID: userID
        });

    }
}

export { BuyerManager }
