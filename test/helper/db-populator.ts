// Database populator class to insert data for testing purposes

import * as Promise from 'bluebird';
const jsf = require('json-schema-faker');
const faker = require('faker');

import { DatabaseManager } from '../../lib/database-manager';
import { Logger          } from '../../lib/logger';
import { ConfigLoader }    from '../../lib/config-loader';

const logger = new Logger("DPOP");


export class DatabasePopulator {

    constructor (
        private dbm: DatabaseManager,
        private config: ConfigLoader
    ) {
        faker.locale = "es_MX";
    }

    public initialize (): Promise<void> {
        return this.dbm.initialize()
            .then(() => {
                logger.info("DatabasePopulator successfully initialized")
            })
            .catch((err) => {
                logger.error(err)
            });
    }

    public shutdown (): void {
        this.dbm.shutdown();
        logger.info("DatabasePopulator gracefully shutdown");
    }

    public newUser (userFields?: any): Promise<any> { //TODO interface userFields
        let newUserData;
        if (!userFields) {
            let schema  = this.config.get('data-gen/new-user-schema');
            newUserData = jsf(schema);
        }
        else {
            newUserData = userFields;
        }
        return this.dbm.insert(newUserData)
            .into("users")
            .then((newBuyerID: number[]) => {
                newUserData.userID = newBuyerID[0];
                logger.info(`Added new User: ${newUserData.userID} `);
                return newUserData;
            })
            .catch((err) => {
                logger.error(err);
                throw err;
            });
    }

    public newBuyer (): Promise<any> { //TODO interface NewBuyerData
        let schema = this.config.get('data-gen/new-buyer-schema');
        let newBuyerData = jsf(schema);
        return this.newUser(newBuyerData.user)
            .then((newUserData: any) => {
                newBuyerData.user.userID = newUserData.userID;
                return this.dbm
                    .insert({userID: newBuyerData.user.userID, dspID: newBuyerData.dspID})
                    .into("ixmBuyers")
                    .catch((e) => { throw e });
            })
            .then(() => {
                logger.info(`Added new Buyer with userID: ${newBuyerData.user.userID}, dspID: ${newBuyerData.dspID}`);
                return newBuyerData;
            })
            .catch((err) => {
                logger.error(err);
                throw err;
            });
    }

    public newPub (): Promise<any> { //TODO Interface NewPubData
        let schema = this.config.get('data-gen/new-pub-schema');
        let newBuyerData = jsf(schema);
        return this.newUser(newBuyerData.user)
            .catch((err) => {
                logger.error(err);
                throw err;
            });
    }

    /*public insertNewPackage (): Promise<number> {
        //TODO
    }*/

}