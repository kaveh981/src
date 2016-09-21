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

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager) {
        this.dbm = database;
    }

    /**
     * Fetch the contact info for a user by id. Currently uses Viper2.users for information.
     * @params id - The user id of the user to get contact information from.
     * @returns A contact model with relevant fields populated.
     */
    public fetchContactInfoById(id: number): Promise<ContactModel> {
        return this.dbm.select('firstName', 'lastName', 'emailAddress', 'phone')
            .from('users')
            .where('userID', id)
            .limit(1)
            .then((rows) => {
                let contactInfo = rows[0];

                if (!contactInfo) {
                    return new ContactModel();
                }

                return new ContactModel({
                    userId: id,
                    name: contactInfo.firstName + ' ' + contactInfo.lastName,
                    emailAddress: contactInfo.emailAddress,
                    phone: contactInfo.phone
                });
            })
            .catch((err) => {
                Log.error(err);
                throw err;
            });
    }

}

export { ContactManager }
