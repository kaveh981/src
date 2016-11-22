'use strict';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { UserManager } from '../user/user-manager';
import { PublisherModel } from './publisher-model';

const Log: Logger = new Logger('mPUB');

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
    public async fetchPublisher(userID: number): Promise<PublisherModel> {

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
