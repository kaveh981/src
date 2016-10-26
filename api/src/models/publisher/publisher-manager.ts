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
    public async fetchPublisherFromId(id: number): Promise<PublisherModel> {
        /** Currently doing nothing, this fucntion should be called unless we add somehing to pub model */
        let pubObject = new PublisherModel();

        let userInfo = await this.userManager.fetchUserFromId(id);

        if (userInfo) {
            pubObject.userInfo = userInfo;
            pubObject.userID = id;
            return pubObject;
        }
    }
}

export { PublisherManager }
