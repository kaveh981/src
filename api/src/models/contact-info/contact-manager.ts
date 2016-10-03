'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { ContactModel } from './contact-model';
import { Logger } from '../../lib/logger';

const Log = new Logger('mCON');

/**
 * Contact Model Manager
 */
class ContactManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager) {
        this.databaseManager = databaseManager;
    }

    /**
     * Fetch the contact info for a user by id. Currently uses Viper2.users for information.
     * @params id - The user id of the user to get contact information from.
     * @returns A contact model with relevant fields populated.
     */
    public fetchContactInfoFromId(id: number): Promise<ContactModel> {
        return this.databaseManager.select('firstName', 'lastName', 'emailAddress', 'phone')
                .from('users')
                .where('userID', id)
                .limit(1)
            .then((rows) => {
                let contactInfo = rows[0];

                if (!contactInfo) {
                    return new ContactModel();
                }

                return new ContactModel({
                    userID: id,
                    name: contactInfo.firstName + ' ' + contactInfo.lastName,
                    emailAddress: contactInfo.emailAddress,
                    phone: contactInfo.phone
                });
            })
            .catch((err) => {
                throw err;
            });
    }

}

export { ContactManager }
