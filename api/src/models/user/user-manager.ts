'use strict';

import * as Promise from 'bluebird';

import { UserModel } from './user-model';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mUSR');

/** User model manager */
class UserManager {

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
     * Returns a user model from an id
     * @param id - The id of the user we want information from.
     */
    public fetchUserFromId(id: string): Promise<UserModel> {
        return this.dbm.select('userID as userId', 'status as userStatus', 'userTypes.name as userType', 'ug.name as userGroup')
                .from('users')
                .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                .where('userID', id)
                .limit(1)
            .then((rows) => {
                return new UserModel(rows[0]);
            })
            .catch((err: Error) => {
                Log.error(err);
            });
    }
}

export { UserManager };
