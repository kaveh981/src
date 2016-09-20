// Database populator class to insert data for testing purposes

import * as Promise from 'bluebird';
const jsf = require('json-schema-faker');
const faker = require('faker');

import { DatabaseManager } from '../lib/database-manager';
import { ConfigLoader    } from '../lib/config-loader';
import { Logger          } from '../lib/logger';

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

    private genDataObj<T> (schemaName: string): T {
        let schema = this.config.get('data-gen/' + schemaName);
        return jsf(schema);
    }

    private extendData<T> (data: any, generatedData: T): T {
        Object.assign(generatedData, data);
        return generatedData;
    }

    public newUser (userFields?: INewUserData): Promise<INewUserData> {
        let newUserData: INewUserData = this.genDataObj<INewUserData>('new-user-schema');

        if (userFields) {
            newUserData = this.extendData<INewUserData>(userFields, newUserData);
        }

        return this.dbm.insert(newUserData, "userID")
            .into("users")
            .then((newBuyerID: number[]) => {
                newUserData.userID = newBuyerID[0];
                Log.info(`Added new User: ${newUserData.userID} `);
                return newUserData;
            })
            .catch((e) => {
                throw e;
            });
    }

    public newBuyer (): Promise<INewBuyerData> {
        let newBuyerData: INewBuyerData = this.genDataObj<INewBuyerData>('new-buyer-schema');
        return this.newUser(newBuyerData.user)
            .then((newUserData: INewUserData) => {
                newBuyerData.user.userID = newUserData.userID;
                return this.dbm
                    .insert({userID: newBuyerData.user.userID, dspID: newBuyerData.dspID})
                    .into("ixmBuyers")
            })
            .then(() => {
                Log.info(`Added new Buyer with userID: ${newBuyerData.user.userID}, dspID: ${newBuyerData.dspID}`);
                return newBuyerData;
            })
            .catch((e) => {
                throw e;
            });
    }

    public newPub (): Promise<INewPubData> {
        let newPubData = this.genDataObj<INewPubData>('new-pub-schema');
        return this.newUser(newPubData.user)
            .then((newUserData: INewUserData) => {
                let publisherData = <any>newPubData.publisher;
                publisherData.userID = newUserData.userID;
                newPubData.user.userID = newUserData.userID;
                return this.dbm
                    .insert(publisherData)
                    .into("publishers");
            })
            .then(() => {
                return newPubData;
            })
            .catch((e) => {
                throw e;
            });
    }

    public newSite (userID: number): Promise<INewSiteData> {
        let newSiteData = this.genDataObj<INewSiteData>('new-site-schema');
        newSiteData.userID = userID;

        return this.dbm
            .insert(newSiteData, "siteID")
            .into("sites")
            .then((siteID: number[]) => {
                newSiteData.siteID = siteID[0];
                Log.info(`Created site ownerID: ${newSiteData.userID}, siteID: ${siteID[0]}`);
                return newSiteData;
            })
            .catch((e) => {
                Log.error(e);
                throw e;
            });
    }

    public newSection (ownerID: number, siteIDs: number[]): Promise<INewSectionData> {
        let section = this.genDataObj<ISection>('new-section-schema');
        section.userID = ownerID;
        let newSectionData = { siteIDs: siteIDs, section: section };
        return this.dbm
            .insert(newSectionData.section, "sectionID")
            .into("rtbSections")
            .then((sectionID: number[]) => {
                newSectionData.section.sectionID = sectionID[0];
                Log.info(`Created section ID: ${newSectionData.section.sectionID}, ownerID: ${newSectionData.section.userID}`);
                return Promise.map(newSectionData.siteIDs, (siteID: number) => {
                        return this.dbm
                            .insert({siteID: siteID, sectionID: newSectionData.section.sectionID})
                            .into("rtbSiteSections")
                    })
                    .then(() => {
                        Log.info('Mapped sectionID: '+ newSectionData.section.sectionID + 
                            'to siteIDs: ' + newSectionData.siteIDs);
                        return newSectionData
                    })
                    .catch((e) => {
                        throw e;
                    })
            });

    }

    /*public newPackage (ownerID: number, sectionIDs: number[]): Promise<INewPackageData> {
        //TODO newPackage method
    }*/

}

export { DatabasePopulator }