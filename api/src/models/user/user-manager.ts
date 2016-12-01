'use strict';

import { UserModel } from './user-model';
import { DatabaseManager } from '../../lib/database-manager';
import { Helper } from '../../lib/helper';

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
    public async fetchUserFromId(userID: number): Promise<UserModel> {

        let rows = await this.databaseManager.select('userID as id', 'status', 'userTypes.name as userType',
                                                     'ug.name as userGroup', 'firstName', 'lastName', 'emailAddress', 'phone')
                                             .from('users')
                                             .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                                             .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                                             .where('userID', userID);

        if (!rows[0]) {
            return;
        }

        return new UserModel({
            id: rows[0].id,
            status:  Helper.statusLetterToWord(rows[0].status),
            userType: rows[0].userType,
            userGroup: rows[0].userGroup,
            firstName: rows[0].firstName,
            lastName: rows[0].lastName,
            emailAddress: rows[0].emailAddress,
            phone: rows[0].phone
        });

    }
}

export { UserManager };
