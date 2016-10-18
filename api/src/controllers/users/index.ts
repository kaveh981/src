'use strict';

import * as express from 'express';

import { Injector } from '../../lib/injector';
import { UserManager } from '../../models/user/user-manager';

const userManager = Injector.request<UserManager>('UserManager');

/**
 * Function that takes care of user information
 */
function Users(router: express.Router): void {

    /**
     * GET request to get contact info for a user
     */
    router.get('/:id', async (req: express.Request, res: express.Response, next: Function) => { try {

        let userID = req.params['id'];
        let contactInfo = await userManager.fetchUserFromId(userID);

        res.sendPayload(contactInfo.toContactPayload());

    } catch (error) { next(error); } });

};

module.exports = Users;
