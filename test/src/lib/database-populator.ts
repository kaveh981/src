'use strict';

/** node_modules */
import * as faker   from 'faker/locale/es_MX';
const jsf = require('json-schema-faker');

/** Lib */
import { DatabaseManager } from './database-manager';
import { ConfigLoader    } from './config-loader';
import { Logger          } from './logger';

const Log = new Logger('DPOP');

/**
 *  Simple Database Populator class used as to insert new entities into a data store during test case
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
     * Constructs a database populator.
     * @param databaseManager - The DB manager used to communicate with the db(s)
     * @param configLoader - The config loader to use. Should point to test config folder
     */
    constructor(databaseManager: DatabaseManager, configLoader: ConfigLoader) {
        this.config = configLoader;
        this.dbm = databaseManager;
    }

    /**
     * Creates a new user entry in Viper2.users.
     * @param [userFields] {INewUserData} - provided user field values to use
     * @returns {Promise<INewUserData>} A promise that resolves with an object containing the inserted user data.
     */
    public async createUser(userFields?: INewUserData) {

        let newUserData = this.generateDataObject<INewUserData>('new-user-schema');
        newUserData.createDate = this.currentMidnightDate();

        if (userFields) {
            Object.assign(newUserData, userFields);
        }

        let newUserIds = await this.dbm.insert(newUserData, ['userID', 'modifyDate']).into('users');
        newUserData.userID = newUserIds[0];

        let modifyDate = await this.dbm.select('modifyDate').from('users').where('userID', newUserData.userID);
        newUserData.modifyDate = modifyDate[0].modifyDate;

        Log.debug(`Created new user ID: ${newUserData.userID} , userType: ${newUserData.userType}`);

        return newUserData;

    }

    /**
     * Creates a new buyer entry based on "new-buyer-schema". Inserts to "Viper2.users", "Viper2.ixmBuyers"
     * @returns {Promise<INewBuyerData>} A promise which resolves with the new buyer data
     */
    public async createBuyer(dspID: number, userFields?: INewUserData) {

        let newBuyerData = this.generateDataObject<INewBuyerData>('new-buyer-schema');

        if (userFields) {
            Object.assign(newBuyerData.user, userFields);
        }

        let newUserData = await this.createUser(newBuyerData.user);
        if (dspID) { newBuyerData.dspID = dspID; }
        newBuyerData.user = newUserData;

        await this.dbm.insert({ userID: newBuyerData.user.userID, dspID: newBuyerData.dspID }).into('ixmBuyers');

        Log.debug(`Added new Buyer with userID: ${newBuyerData.user.userID}, dspID: ${newBuyerData.dspID}`);

        return newBuyerData;

    }

    /**
     * Creates a new publisher entry based on "new-pub-schema". Inserts to "Viper2.users", "Viper2.publishers".
     * @returns {Promise<INewPubData>} A promise which resolves with the new publisher's data
     */
    public async createPublisher(userFields?: INewUserData, publisherFields?: INewPubData) {

        let newPubData = this.generateDataObject<INewPubData>('new-pub-schema');
        newPubData.publisher.approvalDate = this.currentMidnightDate();

        if (userFields) {
            Object.assign(newPubData.user, userFields);
        }

        let newUserData = await this.createUser(newPubData.user);
        let publisherData = newPubData.publisher;
        publisherData.userID = newUserData.userID;
        newPubData.user = newUserData;

        if (userFields) {
            Object.assign(newPubData.publisher, publisherFields);
        }

        await this.dbm.insert(publisherData).into('publishers');

        return newPubData;

    }

    /**
     * Creates a new DSP entity based on "new-dsp-schema". Inserts into "Viper2.rtbDSPs",
     * @param newID {int} - the new DSP ID
     * @returns {Promise<INewDSPData>} - Promise which resolves with an object of new DSP data
     */
    public async createDSP(newID: number, dspFields?: INewDSPData) {

        let newDSPData = this.generateDataObject<INewDSPData>('new-dsp-schema');

        if (dspFields) {
            Object.assign(newDSPData, dspFields);
        }

        newDSPData.dspID = newID;

        await this.dbm.insert(newDSPData).into('rtbDSPs');

        Log.debug(`Created DSP, dspID: ${newDSPData.dspID}`);

        let dsp = await this.dbm.select().from('rtbDSPs').where('dspID', newDSPData.dspID);

        return dsp[0];

    }

    /**
     * Creates a new site entry based on "new-site-schema". Inserts into "Viper2.sites".
     * @param ownerID {int} - the userID of the site owner
     * @returns {Promise<INewSiteData>} - Promise which resolves with object of new site data
     */
    public async createSite(ownerID: number, siteFields?: INewSiteData) {

        let newSiteData = this.generateDataObject<INewSiteData>('new-site-schema');
        newSiteData.userID = ownerID;
        newSiteData.createDate = this.currentMidnightDate();

        if (siteFields) {
            Object.assign(newSiteData, siteFields);
        }

        let siteIDs = await this.dbm.insert(newSiteData, ['siteID']).into('sites');
        newSiteData.siteID = siteIDs[0];

        Log.debug(`Created site ownerID: ${newSiteData.userID}, siteID: ${siteIDs[0]}`);

        let modifyDate = await this.dbm.select('modifyDate').from('sites').where('siteID', newSiteData.siteID);
        newSiteData.modifyDate = modifyDate[0].modifyDate;

        return newSiteData;

    }

    /**
     * Creates a new section entry based on "new-section-schema". Inserts into "Viper2.rtbSections",
     * "Viper2.rtbSiteSections".
     * @param ownerID {int} - the userID of the new section owner
     * @param siteIDs {int[]} - An array of siteIDs to map to the new section
     * @returns {Promise<INewSectionData>} - Promise which resolves with object of new section data
     */
    public async createSection(ownerID: number, siteIDs: number[], sectionFields?: ISection) {

        if (siteIDs.length < 1) {
            Log.error(`1 or more siteIDs are required to create a section you provided ${siteIDs}`);
            return;
        }

        let newSectionData = this.generateDataObject<INewSectionData>('new-section-schema');
        newSectionData.section.userID = ownerID;

        if (sectionFields) {
            Object.assign(newSectionData.section, sectionFields);
        }

        let sectionID = await this.dbm.insert(newSectionData.section, 'sectionID').into('rtbSections');
        newSectionData.section.sectionID = sectionID[0];
        Log.debug(`Created section ID: ${sectionID[0]}, ownerID: ${ownerID}`);
        newSectionData.siteIDs = siteIDs;

        await this.mapSectionToSites(newSectionData.section.sectionID, siteIDs);

        return newSectionData;

    }

    /**
     * Creates a new proposal entity based on "new-proposal-schema". Inserts into "Viper2.ixmDealProposals",
     * "Viper2.ixmProposalSectionMappings"
     * @param ownerID {int} - the userID of the proposal owner
     * @param sectionIDs {int[]} - an array of sectionIDs to be mapped to the new proposal
     * @param proposalFields {INewProposalData} - Optional: a new proposal object to override random fields
     * @returns {Promise<INewProposalData>} - Promise which resolves with an object of new proposal data
     */
    public async createProposal(ownerID: number, sectionIDs: number[], proposalFields?: IProposal) {

        let newProposalObj = this.generateDataObject<IProposal>('new-proposal-schema');
        let newProposal: INewProposalData = { proposal: newProposalObj, sectionIDs: sectionIDs };

        if (proposalFields) {
            Object.assign(newProposal.proposal, proposalFields);
        }

        newProposal.proposal.ownerID = ownerID;
        newProposal.proposal.createDate = this.currentMidnightDate();
        newProposal.proposal.startDate.setHours(0, 0, 0, 0);
        newProposal.proposal.endDate.setHours(0, 0, 0, 0);
        newProposal.proposal.accessMode = 1;

        let proposalID = await this.dbm.insert(newProposal.proposal, 'proposalID').into('ixmDealProposals');
        Log.debug(`Created proposal ID: ${proposalID[0]}`);
        newProposal.proposal.proposalID = proposalID[0];

        let modifyDate = await this.dbm.select('modifyDate').from('ixmDealProposals').where('proposalID', proposalID[0]);
        newProposal.proposal.modifyDate = modifyDate[0].modifyDate;

        await this.mapProposalToSections(newProposal.proposal.proposalID, newProposal.sectionIDs);

        return newProposal;

    }

     /**
     * Creates a new section entry based on "new-negotiation-schema". Inserts into "Viper2.ixmDealNegotiations",
     * "Viper2.ixmDealNegotiations".
     * @param proposalID {int} - proposalID of the proposal being negotiated
     * @param publisherID {int} - publisherID to whom the proposal belongs to
     * @param buyerID {int} - buyerID of buyer negotiating with publisher
     * @returns {Promise<IDealNegotiationData>} - Promise which resolves with object of new section data
     */
    public async createDealNegotiation (proposalID: number, publisherID: number, buyerID: number, optionalFields?: IDealNegotiationData) {

        let newDealNegotiationData = this.generateDataObject<IDealNegotiationData>('new-negotiation-schema');

        if (optionalFields) {
            Object.assign(newDealNegotiationData, optionalFields);
        }

        newDealNegotiationData.proposalID = proposalID;
        newDealNegotiationData.publisherID = publisherID;
        newDealNegotiationData.buyerID = buyerID;
        Log.debug(`updated fields`);

        let newDealNegotiationIds;

        try {
            newDealNegotiationIds = await this.dbm.insert(newDealNegotiationData, 'negotiationID').into('ixmDealNegotiations');
            newDealNegotiationData.negotiationID = newDealNegotiationIds[0];
            Log.debug('NegotiationID is ' + newDealNegotiationData.negotiationID);
        } catch (err) {
            Log.trace(err);
            return;
        }

        let selection;
        try {
            selection = await this.dbm.select('modifyDate').from('ixmDealNegotiations')
                                        .where('negotiationID', newDealNegotiationData.negotiationID);
            newDealNegotiationData.modifyDate = selection[0].modifyDate;
            Log.debug("modifyDate is " + newDealNegotiationData.modifyDate);
        } catch (err) {
            Log.trace(err);
            return;
        }

        Log.debug(`updated modifyDate`);
        Log.debug(`Created new negotiation, ID: ${newDealNegotiationData.negotiationID}`);

        return newDealNegotiationData;

    }

    /**
     * Maps a proposal to 1 or more sections.
     * @arg proposalID {int} - the proposalID to map
     * @arg sectionIDs {int[]} - an array of sectionIDs to map to the given proposalID
     * @returns {Promise<void>} Promise that resolves when all mappings done
     */
    public async mapProposalToSections(proposalID: number, sectionIDs: number[]) {

        for (let i = 0; i < sectionIDs.length; i += 1) {
            let mapping = {proposalID: proposalID, sectionID: sectionIDs[i]};

            await this.dbm.insert(mapping).into('ixmProposalSectionMappings');
            Log.debug(`Mapped proposalID ${proposalID} to sectionID ${sectionIDs[i]}`);
        }

    }

    /**
     * Creates mapping entry in "Viper2.rtbSiteSections"
     * @arg sectionID {number} - the sectionID of the section to map
     * @arg siteIDs {number[]} - an array of siteIDs to map to sectionID
     * @returns {Promise<void>} Resolves when all mapping entries have been successful
     */
    public async mapSectionToSites(sectionID: number, siteIDs: number[]) {
        for (let i = 0; i < siteIDs.length; i += 1) {
            let mapping = {sectionID: sectionID, siteID: siteIDs[i]};

            await this.dbm.insert(mapping).into('rtbSiteSections');

            Log.debug(`Mapped sectionID ${sectionID} to siteID ${siteIDs[i]}`);
        }
    }

    /**
     * Generates an entity based on a jsf schema, e.g. "generateDataObject<INewUserData>('new-user-schema')" returns a
     * newUserData object.
     * @param schemaName - The name of the schema to use. Use same name of the schema .json file located in
     * config/data-gen/ without the extension.
     * @returns {T} An object generated as configured in the given schema
     */
    private generateDataObject<T>(schemaName: string): T {
        // load a copy of the JsfSchema
        let schema: IJsfSchema = JSON.parse(JSON.stringify(this.config.get(`data-gen/${schemaName}`)));

        schema = this.extendSchemaObject(schema);

        let data = <T>jsf(schema);
        data = this.extendDataObject(data);

        return data;
    }

    /**
     * Changes '0' to 0; string to number. This is a problem with jsf because it doesn't generate properties with value
     * 0. Instead, use '0' (string) in the schema file and call this method to change all '0' to 0.
     * @param data {any} - Generated data from jsf
     */
    private extendDataObject(data: any): any {
        for (let key in data) {

            if (data.hasOwnProperty(key)) {
                let value = data[key];

                if (typeof value === 'object') {
                    data[key] = this.extendDataObject(value);
                }

                if (value === '0') {
                    data[key] = 0;
                }
            }

        }
        return data;
    }

    /**
     * Extends a JSF schema by looping through its properties and loading any referenced schemas
     * @param schema {IJsfSchema} - the schema to extend
     * @returns {IJsfSchema} - the resolved schema object fully loaded from all referenced files
     */
    private extendSchemaObject(schema: IJsfSchema): IJsfSchema {

        // If has a reference to other schema *.json file,
        // load it and return the extended version of it
        if (schema.hasOwnProperty('__ref__')) {
            let refSchema = this.config.get(`data-gen/${schema.__ref__}`);

            if (schema.hasOwnProperty('properties')) {
                Object.assign(refSchema.properties, schema.properties);
            }

            return this.extendSchemaObject(refSchema);
        }

        // if schema has some properties, let's loop through them and see if they contain other schemas
        // in which case it is extended recursively
        if (schema.hasOwnProperty('properties')) {
            for (let key in schema.properties) {
                if (!schema.properties.hasOwnProperty(key)) { continue; }
                let value = schema.properties[key];

                if (typeof value === 'object') {

                    if (value.hasOwnProperty('__ref__') || value.hasOwnProperty('properties')) {
                        schema.properties[key] = this.extendSchemaObject(value);
                    }

                }
            }
        }

        return schema;
    }

    /**
     * Get the current date in a MySQL datetime format.
     * @returns string the current formatted date
     */
    private currentMySQLDate(): string {
        let date = new Date();

        return date.getFullYear() + '-' +
            ('00' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('00' + date.getDate()).slice(-2) + ' ' +
            ('00' + date.getHours()).slice(-2) + ':' +
            ('00' + date.getMinutes()).slice(-2) + ':' +
            ('00' + date.getSeconds()).slice(-2);
    }

    private currentMidnightDate(): Date {
        let date = new Date();
        date.setHours(0, 0, 0, 0);

        return date;
    }

}

export { DatabasePopulator }
