'use strict';

import { DatabaseManager } from '../../lib/database-manager';
import { UserManager } from '../user/user-manager';
import { MarketUserModel } from './market-user-model';

/** Manages the market user model */
class MarketUserManager {

    /** Internal database manager */
    private databaseManager: DatabaseManager;

    /** Internal user manager */
    private userManager: UserManager;

    /** Bob the builder */
    constructor(databaseManager: DatabaseManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.userManager = userManager;
    }

    /** 
     * Get a market user from the contact or company id.
     * @param userID - The user id of the contact or company id.
     * @returns A market user.
     */
    public async fetchMarketUserFromId(userID: number) {

        let rows = await this.databaseManager.select('userID', 'companyID', 'permissions').from('ixmUserCompanyMapping').where('userID', userID);

        if (!rows[0]) {
            rows = await this.databaseManager.select('userID', 'userID as companyID').from('ixmCompanyWhitelist').where('userID', userID);
        }

        if (!rows[0]) {
            return;
        }

        let marketUser = new MarketUserModel({
            readOnly: rows[0].permissions === 'read'
        });

        await Promise.all([ (async () => {
            marketUser.company = await this.userManager.fetchUserFromId(rows[0].companyID);
        })(), (async () => {
            marketUser.contact = await this.userManager.fetchUserFromId(rows[0].userID);
        })() ]);

        return marketUser;

    }

}

export { MarketUserManager };
