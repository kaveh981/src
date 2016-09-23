'use strict';

import * as Promise from 'bluebird';
import * as faker   from 'faker';
const jsf = require('json-schema-faker');

import { DatabaseManager } from '../lib/database-manager';
import { ConfigLoader    } from '../lib/config-loader';
import { Logger          } from '../lib/logger';

const Log = new Logger('DPOP');

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
        faker.locale = 'es_MX';
    }

    /**
     * Generates an entity based on a jsf schema, e.g. "genDataObj<INewUserData>('new-user-schema')" returns a
     * newUserData object.
     * @param schemaName - The name of the schema to use. Use same name of the schema .json file located in
     * config/data-gen/ without the extension.
     * @returns {T} An object generated as configured in the given schema
     */
    private genDataObj<T> (schemaName: string): T {
        let schema: IJsfSchema = this.config.get(`data-gen/${schemaName}`);
        schema = this.extendSchemaObj(schema);

        return <T>jsf(schema);
    }

    /**
     * Extends a JSF schema by looping through its properties and loading any referenced schemas
     * @param schema {IJsfSchema} - the schema to extend
     * @returns {IJsfSchema} - the resolved schema object fully loaded from all referenced files
     */
    private extendSchemaObj (schema: IJsfSchema): IJsfSchema {

        // If has a reference to other schema *.json file,
        // load it and return the extended version of it
        if (schema.hasOwnProperty('__ref__')) {
            let refSchema = this.config.get(`data-gen/${schema.__ref__}`);

            if (schema.hasOwnProperty('properties')) {
                Object.assign(refSchema.properties, schema.properties);
            }

            return this.extendSchemaObj(refSchema);
        }

        // if schema has some properties, let's loop through them and see if they contain other schemas
        // in which case it is extended recursively
        if (schema.hasOwnProperty('properties')) {
            for (let key in schema.properties) {
                let value = schema.properties[key];

                if (typeof value === 'object') {

                    if (value.hasOwnProperty('__ref__') || value.hasOwnProperty('properties')) {
                        schema.properties[key] = this.extendSchemaObj(value);
                    }

                }
            }
        }

        return schema;
    }

    /**
     * Creates a new user entry in Viper2.users.
     * @param [userFields] {INewUserData} - provided user field values to use
     * @returns {Promise<INewUserData>} A promise that resolves with an object containing the inserted user data.
     */
    public newUser (userFields?: INewUserData): Promise<INewUserData> {
        let newUserData: INewUserData = this.genDataObj<INewUserData>('new-user-schema');

        if (userFields) {
            Object.assign(newUserData, userFields);
        }

        return this.dbm.insert(newUserData, 'userID')
            .into('users')
            .then((newUserID: number[]) => {
                newUserData.userID = newUserID[0];
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
        let newBuyerData = this.genDataObj<INewBuyerData>('new-buyer-schema');

        return this.newUser(newBuyerData.user)
            .then((newUserData: INewUserData) => {
                newBuyerData.user.userID = newUserData.userID;
                return this.dbm
                    .insert({userID: newBuyerData.user.userID, dspID: newBuyerData.dspID})
                    .into('ixmBuyers')
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
                    .into('publishers');
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
            .insert(newSiteData, 'siteID')
            .into('sites')
            .then((siteID: number[]) => {
                newSiteData.siteID = siteID[0];
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

        if (siteIDs.length < 1) {
            Log.error(`1 or more siteIDs are required to create a section you provided ${siteIDs}`);
            return
        }

        let newSectionData = this.genDataObj<INewSectionData>('new-section-schema');
        newSectionData.userID = ownerID;

        return this.dbm
            .insert(newSectionData, 'sectionID')
            .into('rtbSections')
            .then((sectionID: number[]) => {
                newSectionData.sectionID = sectionID[0];
                Log.debug(`Created section ID: ${newSectionData.sectionID}, ownerID: ${newSectionData.userID}`);
                newSectionData.siteIDs = siteIDs;

                return this.newSiteSectionMapping(newSectionData.sectionID, siteIDs);
            })
            .then(() => {
                return newSectionData;
            })
            .catch((e) => {
                throw e;
            });
    }

    /**
     * Creates mapping entry in "Viper2.rtbSiteSections"
     * @arg sectionID {number} - the sectionID of the section to map
     * @arg siteIDs {number[]} - an array of siteIDs to map to sectionID
     * @returns {Promise<void>} Resolves when all mapping entries have been successful
     */
    private newSiteSectionMapping = Promise.coroutine(function* (sectionID: number, siteIDs: number[]) {

        for ( let i = 0; i < siteIDs.length; i += 1 ) {
            let mapping = { sectionID: sectionID, siteID: siteIDs[i] };
            yield this.dbm.insert(mapping).into("rtbSiteSections");
            Log.debug(`Mapped sectionID: ${sectionID}, to siteID: ${siteIDs[i]}`);
        }

    }) as (sectionID: number, siteIDs: number[]) => Promise<void>;

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
            .then((packageID: number[]) => {
                Log.debug(`Created package ID: ${packageID[0]}`);
                newPackage.sectionIDs = sectionIDs;
                return Promise.map(sectionIDs, (sectionID) => {
                    return this.dbm
                        .insert({packageID: packageID[0], sectionID: sectionID})
                        .into("ixmPackageSectionMappings")
                        .then(() => {
                            Log.debug(`Mapped packageID ${packageID[0]} to sectionID ${sectionID}`);
                        });
                });
            })
            .then(() => {
                return newPackage;
            })
            .catch((e) => {
                throw e;
            });
    }
}

export { DatabasePopulator }