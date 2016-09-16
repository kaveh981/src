'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../lib/database-manager';
import { Logger } from '../lib/logger';

const Log = new Logger('mUSR');

/**
 * Generic IX user model.
 */
class UserModel {

    /** The user's userId */
    public userId: string;

    /** The current status of the user */
    public userStatus: string;

    /** The abbreviated name of the user type. */
    public userType: string;

    /** The usergroup to which this user belongs. */
    public userGroup: string;

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /**
     * Constructor
     * @param userId - The user id of the user.
     * @param database - An instance of the database manager.
     * @param populate - If the 
     */
    constructor(userId: string, database?: DatabaseManager, initialParams: any = {}) {

        /** Warn if no dbm was passed to this model. */
        if (!database || database === null) {
            Log.warn('No database was passed to this user model.');
        } else {
            this.dbm = database;
        }

        this.userId = userId;

        Object.assign(this, initialParams);
    }

    /**
     * Populate the fields of this user model, this happens synchronously.
     * @param: id - The id of the user to model.
     * @returns The object itself (this).
     */
    public populate(): Promise<UserModel> {
        if (!this.dbm) {
            Log.error('No database was configured to populate.');
            return Promise.resolve(this);
        }

        return this.dbm.select('userID as userId', 'status as userStatus', 'userTypes.name as userType', 'ug.name as userGroup')
                .from('users')
                .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                .where('userID', this.userId)
                .limit(1)
            .then((rows) => {
                Object.assign(this, rows[0]);
                return this;
            });
    }
}


export { UserModel };
