'use strict';

import { DatabaseManager } from '../../lib/database-manager';
import { UserManager } from '../user/user-manager';
import { PublisherModel } from './publisher-model';

/** Publisher' model manager */
class PublisherManager {

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
     * Returns a Publisher model from a userID 
     * @param userId - The userID of the Publisher we want information from.
     * @returns A promise for a new Publisher model.
     */
    public async fetchPublisherFromId(userID: number): Promise<PublisherModel> {

        let userInfo = await this.userManager.fetchUserFromId(userID);

        if (!userInfo) {
            return;
        }

        return new PublisherModel({
            userInfo: userInfo,
            userID: userID
        });

    }
}

export { PublisherManager }
