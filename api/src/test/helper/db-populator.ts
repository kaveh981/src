// Database pupulator class to insert data for testing purposes

import * as Promise from 'bluebird';
// import * as jsf from 'json-schema-faker';
const jsf = require('json-schema-faker');
// import * as faker from 'faker';
const faker = require('faker');

import { DatabaseManager } from './database-manager';
import { Logger          } from './logger';
import { ConfigLoader } from './config-loader';

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

    public newUser (userFields?: any): Promise<any> {
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

    public newBuyer (): Promise<any> {
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

    /*public insertNewPub (): Promise<number> {
        //TODO Maybe you don't even need it
    }

    public insertNewPackage (): Promise<number> {
        //TODO
    }*/

}