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
        let userId = req.params['id'];

        contactManager.fetchContactInfoFromId(userId)
            .then((contactInfo) => {
                if (!contactInfo.emailAddress) {
                    res.sendNotFoundError();
                    return;
                }

                res.sendPayload({
                    title: contactInfo.title,
                    name: contactInfo.name,
                    email: contactInfo.emailAddress,
                    phone: contactInfo.phone
                });
            });
    });

};

module.exports = Users;
