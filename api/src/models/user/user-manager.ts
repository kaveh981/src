'use strict';

import * as Promise from 'bluebird';

import { UserModel } from './user-model';
import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

/** User model manager */
class UserManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Returns a user model from an id
     * @param userId - The id of the user we want information from.
     * @returns A user model for that user.
     */
    public fetchUserFromId(userID: number): Promise<UserModel> {

        return this.databaseManager.select('userID as id', 'status', 'userTypes.name as userType',
                'ug.name as userGroup', 'firstName', 'lastName', 'emailAddress', 'phone')
                .from('users')
                .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                .where('userID', userID)
            .then((rows) => {
                return new UserModel(rows[0]);
            });

    }
}

export { UserManager };
