// Database populator class to insert data for testing purposes

import * as Promise from 'bluebird';
const jsf = require('json-schema-faker');
const faker = require('faker');

import { DatabaseManager } from '../../api/src/lib/database-manager';
import { Logger          } from '../../api/src/lib/logger';
import { ConfigLoader    } from '../../api/src/lib/config-loader';

const Log = new Logger("DPOP");


class DatabasePopulator {

    private dbm: DatabaseManager;
    private config: ConfigLoader;

    constructor (
        databaseManager: DatabaseManager,
        configLoader: ConfigLoader
    ) {
        this.config = configLoader;
        this.dbm = databaseManager;
        faker.locale = "es_MX";
    }

    public initialize (): Promise<void> {
        return this.dbm.initialize()
            .then(() => {
                Log.info("DatabasePopulator successfully initialized")
            })
            .catch((err) => {
                Log.error(err)
            });
    }

    public shutdown (): void {
        this.dbm.shutdown();
        Log.info("DatabasePopulator gracefully shutdown");
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
                Log.info(`Added new User: ${newUserData.userID} `);
                return newUserData;
            })
            .catch((err) => {
                Log.error(err);
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
                Log.info(`Added new Buyer with userID: ${newBuyerData.user.userID}, dspID: ${newBuyerData.dspID}`);
                return newBuyerData;
            })
            .catch((err) => {
                Log.error(err);
                throw err;
            });
    }

    public newPub (): Promise<any> { //TODO Interface NewPubData
        let schema = this.config.get('data-gen/new-pub-schema');
        let newPubData = jsf(schema);
        return this.newUser(newPubData.user)
            .then((newUserData: any) => {
                let publisherData = newPubData.publisher;
                publisherData.userID = newUserData.userID;
                newPubData.user.userID = newUserData.userID;
                return this.dbm
                    .insert(publisherData)
                    .into("publishers");
            })
            .catch((err) => {
                Log.error(err);
                throw err;
            });
    }

    /*public insertNewPackage (): Promise<number> {
        //TODO
    }*/

}

export { DatabasePopulator }