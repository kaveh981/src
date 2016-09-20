'use strict';

import * as express from 'express';
import * as Promise from 'bluebird';

import { Logger } from '../../lib/logger';
import { Injector } from '../../lib/injector';

import { ContactManager } from '../../models/contact-info/contact-manager';

const contactManager = Injector.request<ContactManager>('ContactManager');

/**
 * Function that takes care of user information
 */
function ContactUser(router: express.Router): void {

    /**
     * GET request to get contact info for a user
     */
    router.get('/:id', (req: express.Request, res: express.Response) => {
        let userId = req.params['id'];

        contactManager.fetchContactInfoById(userId)
            .then((contactInfo) => {
                if (!contactInfo.emailAddress) {
                    res.sendNotFoundError();
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

module.exports = ContactUser;
