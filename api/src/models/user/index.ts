'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';

interface IUserModel {
    userId: number;
    userType: string;
    userGroup: string;
}

// Generic index user model
class UserModel {

    // Return user information by id
    public static getUserModelById(userId: number): Promise<IUserModel> {
        return DatabaseManager.raw('\
                SELECT userID as userId, userTypes.name as userType, ug.name as userGroup \
                FROM (users JOIN userTypes ON userType = userTypeID) JOIN userGroups as ug using (userGroupID) \
                WHERE userId=? \
                LIMIT 1;', userId)
            .then((rows: IUserModel) => {
                return rows[0];
            });
    }

}

export { UserModel };
