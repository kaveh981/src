'use strict';

import * as Promise from 'bluebird';
import * as faker from 'faker';
const jsf = require('json-schema-faker');

import { DatabaseManager } from '../lib/database-manager';
import { ConfigLoader    } from '../lib/config-loader';
import { Logger          } from '../lib/logger';

const Log = new Logger("DPOP");

/**
 *  Simple Database Populator class used as a helper tool to insert new entities into a data store during test case
 *  setup.
 *
 *  Depends on:
 *      "DatabaseManager" (singleton)
 *      "ConfigLoader" (singleton)
 */
class DatabasePopulator {

    private dbm: DatabaseManager;
    private config: ConfigLoader;

    /**
     * Constructs a database populator. Sets the region of faker to Mexico.
     * @param databaseManager - The DB manager used to communicate with the db(s)
     * @param configLoader - The config loader to use. Should point to test config folder
     */
    constructor (
        databaseManager: DatabaseManager,
        configLoader: ConfigLoader
    ) {
        this.config = configLoader;
        this.dbm = databaseManager;
        faker.locale = "es_MX";
    }

    /**
     * Generates an entity based on a jsf schema, e.g. "genDataObj<INewUserData>('new-user-schema')" returns a
     * newUserData object.
     * @param schemaName - The name of the schema to use. Use same name of the schema .json file located in
     * config/data-gen/ without the extension.
     * @returns {T} An object generated as configured in the given schema
     */
    private genDataObj<T> (schemaName: string): T {
        let schema = this.config.get('data-gen/' + schemaName);
        return <T>jsf(schema);
    }

    /**
     * Extends the given generated data object with specified data values.
     * @param data {any}- the object containing the key/value pairs
     * @param generatedData {T}- the generated data object that is to be extended
     * @returns {T} the extended data object
     */
    private extendData<T> (data: any, generatedData: T): T {
        Object.assign(generatedData, data);
        return generatedData;
    }

    /**
     * Creates a new user entry in Viper2.users.
     * @param [userFields] {INewUserData} - provided user field values to use
     * @returns {Promise<INewUserData>} A promise that resolves with an object containing the inserted user data.
     */
    public newUser (userFields?: INewUserData): Promise<INewUserData> {
        let newUserData: INewUserData = this.genDataObj<INewUserData>('new-user-schema');

        if (userFields) {
            newUserData = this.extendData<INewUserData>(userFields, newUserData);
        }

        return this.dbm.insert(newUserData, "userID")
            .into("users")
            .then((newBuyerID: number) => {
                newUserData.userID = newBuyerID;
                Log.debug(`Created new user ID: ${newUserData.userID} , userType: ${newUserData.userType}`);
                return newUserData;
            })
            .catch((e) => {
                throw e;
            });
    }

    /**
     * Creates a new buyer entry based on "new-buyer-schema". Inserts to "Viper2.users", "Viper2.ixmBuyers"
     * @returns {Promise<INewBuyerData>} A promise which resolves with the new buyer data
     */
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
                Log.debug(`Added new Buyer with userID: ${newBuyerData.user.userID}, dspID: ${newBuyerData.dspID}`);
                return newBuyerData;
            })
            .catch((e) => {
                throw e;
            });
    }

    /**
     * Creates a new publisher entry based on "new-pub-schema". Inserts to "Viper2.users", "Viper2.publishers".
     * @returns {Promise<INewPubData>} A promise which resolves with the new publisher's data
     */
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

    /**
     * Creates a new site entry based on "new-site-schema". Inserts into "Viper2.sites".
     * @param ownerID {int} - the userID of the site owner
     * @returns {Promise<INewSiteData>} - Promise which resolves with object of new site data
     */
    public newSite (ownerID: number): Promise<INewSiteData> {
        let newSiteData = this.genDataObj<INewSiteData>('new-site-schema');
        newSiteData.userID = ownerID;

        return this.dbm
            .insert(newSiteData, "siteID")
            .into("sites")
            .then((siteID: number) => {
                newSiteData.siteID = siteID;
                Log.debug(`Created site ownerID: ${newSiteData.userID}, siteID: ${siteID[0]}`);
                return newSiteData;
            })
            .catch((e) => {
                Log.error(e);
                throw e;
            });
    }


    /**
     * Creates a new section entry based on "new-section-schema". Inserts into "Viper2.rtbSections",
     * "Viper2.rtbSiteSections".
     * @param ownerID {int} - the userID of the new section owner
     * @param siteIDs {int[]} - An array of siteIDs to map to the new section
     * @returns {Promise<INewSectionData>} - Promise which resolves with object of new section data
     */
    public newSection (ownerID: number, siteIDs: number[]): Promise<INewSectionData> {
        let section = this.genDataObj<ISection>('new-section-schema');
        section.userID = ownerID;
        let newSectionData = { siteIDs: siteIDs, section: section };
        return this.dbm
            .insert(newSectionData.section, "sectionID")
            .into("rtbSections")
            .then((sectionID: number) => {
                newSectionData.section.sectionID = sectionID;
                Log.debug(`Created section ID: ${newSectionData.section.sectionID}, ownerID: ${newSectionData.section.userID}`);
                return Promise.map(newSectionData.siteIDs, (siteID: number) => {
                        return this.dbm
                            .insert({siteID: siteID, sectionID: newSectionData.section.sectionID})
                            .into("rtbSiteSections").
                            then(() => {
                                Log.debug('Mapped sectionID: '+ newSectionData.section.sectionID +
                                    ' to siteID: ' + siteID);
                            });
                    });
            })
            .then(() => {
                return newSectionData
            })
            .catch((e) => {
                throw e;
            });
    }

    /**
     * Creates a new package entity based on "new-package-schema". Inserts into "Viper2.ixmPackages",
     * "Viper2.ixmPackageSectionMappings"
     * @param ownerID {int} - the userID of the package owner
     * @param sectionIDs {int[]} - an array of sectionIDs to be mapped to the new package
     * @returns {Promise<INewPackageData>} - Promise which resolves with an object of new package data
     */
    public newPackage (ownerID: number, sectionIDs: number[]): Promise<INewPackageData> {
        let newPackage = this.genDataObj<INewPackageData>('new-package-schema');
        newPackage.ownerID = ownerID;
        return this.dbm
            .insert(newPackage, "packageID")
            .into("ixmPackages")
            .then((packageID: number[]) =>{
                Log.debug(`Created package ID: ${packageID}`);
                newPackage.sectionIDs = sectionIDs;
                return Promise.map(sectionIDs, (sectionID) => {
                    return this.dbm
                        .insert({packageID: packageID, sectionID: sectionID})
                        .into("ixmPackageSectionMappings")
                        .then(() => {
                            Log.debug(`Mapped packageID ${packageID} to sectionID ${sectionID}`);
                        })
                        .catch((e) => {
                            throw e;
                        });
                })
                .then(() => {
                    return newPackage;
                });
            })
            .catch((e) => {
                throw e;
            });
    }
}

export { DatabasePopulator }