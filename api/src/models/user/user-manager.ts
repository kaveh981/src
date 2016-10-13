'use strict';

import * as Promise from 'bluebird';

import { UserModel } from './user-model';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mUSR');

/** User model manager */
class UserManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Returns a user model from an id
     * @param id - The id of the user we want information from.
     * @returns the corresponding user object
     */
    public fetchUserFromId(userID: string): Promise<UserModel> {
        return this.databaseManager.select('userID', 'status', 'userTypes.name as userType', 'ug.name as userGroup')
                .from('users')
                .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                .where('userID', userID)
                .limit(1)
            .then((rows) => {
                return new UserModel(rows[0]);
            })
            .catch((err: Error) => {
                throw err;
            });
    }
}

export { UserManager };
