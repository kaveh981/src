'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('USER');

/**
 * Interface for information about a given user.
 */
interface IUserModel {
    /** The user's userId */
    userId: number;
    /** The current status of the user */
    userStatus: string;
    /** The abbreviated name of the user type. */
    userType: string;
    /** The usergroup to which this user belongs. */
    userGroup: string;
}

/**
 * Generic IX user model.
 */
class UserModel {

    /**
     * Return user information by id.
     * @param userId - The user id of the user we want information from.
     * @returns Returns a promise with an IUserModel, undefined if nothing.
     */
    public static getUserModelById(userId: number): Promise<IUserModel> {
        return DatabaseManager
                .select('userID as userId', 'status as userStatus', 'userTypes.name as userType', 'ug.name as userGroup')
                .from('users')
                .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                .where('userID', userId)
                .limit(1)
            .then((rows: IUserModel) => {
                return rows[0];
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

    public static isActiveUser(userId: number): Promise<boolean> {
        return DatabaseManager.select()
            .from('users')
            .where({
                userId: userId,
                status: 'A'
            })
            .limit(1)
            .then((rows: any) => {
                return rows.length !== 0;
            })
            .catch((err: Error) => {
                Log.error(err);
                throw err;
            });
    }

}
export { UserModel };
