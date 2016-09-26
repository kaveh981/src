'use strict';

class UserModel implements IUserModel {
    /** The user's userId */
    public userID: string;
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

export { UserModel }
