'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

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
    router.get('/:id', Promise.coroutine(function* (req: express.Request, res: express.Response): any {

        let userID = req.params['id'];
        let contactInfo = yield userManager.fetchUserFromId(userID);

        res.sendPayload(contactInfo.toContactPayload());

    }) as any);

};

module.exports = Users;
