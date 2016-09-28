'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Injector } from '../../lib/injector';
import { ContactManager } from '../../models/contact-info/contact-manager';

const contactManager = Injector.request<ContactManager>('ContactManager');

/**
 * Function that takes care of user information
 */
function Users(router: express.Router): void {

    /**
     * GET request to get contact info for a user
     */
    router.get('/:id', (req: express.Request, res: express.Response) => {
        let userID = req.params['id'];

        contactManager.fetchContactInfoFromId(userID)
            .then((contactInfo) => {
                if (!contactInfo.emailAddress) {
                    res.sendNotFoundError();
                    return;
                }

                res.sendPayload({ contact: contactInfo.toPayload() });
            });
    });

};

module.exports = Users;
