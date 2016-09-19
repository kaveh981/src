'use strict';

interface IUserModel {
    /** The user's userId */
    userId: string;

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
class UserModel implements IUserModel {
    /** The user's userId */
    public userId: string;

    /** The current status of the user */
    public userStatus: string;

    /** The abbreviated name of the user type. */
    public userType: string;

    /** The usergroup to which this user belongs. */
    public userGroup: string;

    /**
     * Constructor
     * @param initParams - Initial parameters to populate the user model.
     */
    constructor(initParams?: IUserModel) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }
}