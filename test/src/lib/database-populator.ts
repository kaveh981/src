'use strict';

/** node_modules */
import * as faker   from 'faker/locale/es_MX';
import * as crypto from 'crypto';
const jsf = require('json-schema-faker');

/** Lib */
import { DatabaseManager } from './database-manager';
import { ConfigLoader    } from './config-loader';
import { Logger          } from './logger';

const Log = new Logger('DPOP');
const BUYER_COMPANY_USERTYPE = 2;
const PUB_COMPANY_USERTYPE = 18;

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

        // Hash the password for SH Auth.

        let hashConfig = this.config.get('api-config');
        let hashedPassword: string;

        await new Promise((resolve, reject) => {
            crypto.randomBytes(hashConfig['salt-bytes'], (err, salt) => {
                let saltString = salt.toString('base64');
                let hash = crypto.pbkdf2Sync(newUserData.password, saltString, hashConfig['iterations'], hashConfig['hash-bytes'], 'sha1');
                hashedPassword = hash.toString('base64') + saltString;
                resolve();
            });
        });

        let newUserDataCopy = Object.assign({}, newUserData);
        newUserDataCopy.password = hashedPassword;

        let newUserIds = await this.dbm.insert(newUserDataCopy, [ 'userID' ]).into('users');
        newUserData.userID = newUserIds[0];

        let modifyDate = await this.dbm.select('modifyDate').from('users').where('userID', newUserData.userID);
        newUserData.modifyDate = modifyDate[0].modifyDate;

        Log.debug(`Created new user ID: ${newUserData.userID} , userType: ${newUserData.userType}`);

        return newUserData;

    }

    /**
     * Create an apiKey for the given user
     * @param userID - The user ID to create the API Key.
     * @param phrase - The phrase to hash for the key.
     * @returns The hashed apiKey.
     */
    public async createAPIKey(userID: number, phrase: string) {

        let hashConfig = this.config.get('api-config');
        let hashedPassword: string;

        await new Promise((resolve, reject) => {
            crypto.randomBytes(hashConfig['salt-bytes'], (err, salt) => {
                let saltString = salt.toString('base64');
                let hash = crypto.pbkdf2Sync(phrase, saltString, hashConfig['iterations'], hashConfig['hash-bytes'], 'sha1');
                hashedPassword = hash.toString('base64') + saltString;
                resolve();
            });
        });

        await this.dbm.insert({
            userID: userID,
            apiKey: hashedPassword,
            status: 'A',
            version: 1
        }).into('apiKeys');

        return hashedPassword;

    }

    /**
     * Creates a new buyer entry based on "new-buyer-schema". Inserts to "Viper2.users", "Viper2.ixmUserCompanyMapping".
     * @returns {Promise<INewBuyerData>} A promise which resolves with the new buyer data
     */
    public async createBuyer(companyID: number, permissions: 'read' | 'write', userFields?: INewUserData) {

        let newBuyerData = this.generateDataObject<INewBuyerData>('new-buyer-schema');

        if (userFields) {
            Object.assign(newBuyerData.user, userFields);
        }

        let newUserData = await this.createUser(newBuyerData.user);
        newBuyerData.companyID = companyID;
        newBuyerData.permissions = permissions;
        newBuyerData.user = newUserData;

        await this.dbm.insert({ userID: newBuyerData.user.userID, companyID: newBuyerData.companyID,
                                permissions: newBuyerData.permissions }).into('ixmUserCompanyMapping');

        Log.debug(`Added new Buyer with userID: ${newBuyerData.user.userID}, companyID: ${newBuyerData.companyID}, permissions: ${newBuyerData.permissions}`);

        return newBuyerData;

    }

    /**
     * Creates a new publisher entry based on "new-pub-schema". Inserts to "Viper2.users", "Viper2.publishers", "Viper2.ixmUserCompanyMapping".
     * @returns {Promise<INewPubData>} A promise which resolves with the new publisher's data
     */
    public async createPublisher(companyID: number, permissions: 'read' | 'write', userFields?: INewUserData, publisherFields?: INewPubData) {

        let newPubData = this.generateDataObject<INewPubData>('new-pub-schema');
        newPubData.publisher.approvalDate = this.currentMidnightDate();

        if (userFields) {
            Object.assign(newPubData.user, userFields);
        }

        let newUserData = await this.createUser(newPubData.user);
        newPubData.companyID = companyID;
        newPubData.permissions = permissions;
        newPubData.user = newUserData;

        let publisherData = newPubData.publisher;
        publisherData.userID = newUserData.userID;

        if (userFields) {
            Object.assign(newPubData.publisher, publisherFields);
        }

        await this.dbm.insert(publisherData).into('publishers');

        await this.dbm.insert({ userID: newPubData.user.userID, companyID: newPubData.companyID,
                                permissions: newPubData.permissions }).into('ixmUserCompanyMapping');

        Log.debug(`Added new Publisher with userID: ${newPubData.user.userID}, companyID: ${newPubData.companyID}, permissions: ${newPubData.permissions}`);

        return newPubData;

    }

    /**
     * Creates a new company entry based on "new-company-schema". Inserts to "Viper2.users", "Viper2.ixmCompanyWhitelist", and optionally to
     * "Viper2.rtbTradingDesks".
     * @returns {Promise<INewCompanyData>} A promise which resolves with the new company's data
     */
    public async createCompany(userFields: INewUserData = {}, dspID?: number) {

        let newCompanyData = this.generateDataObject<INewCompanyData>('new-company-schema');

        if (dspID) {
            let dsps = await this.dbm.from('rtbDSPs').where('dspID', dspID);

            if (dsps.length === 0) {
                Log.error(`DSP with dspID: ${dspID} not found`);
                return;
            }

            newCompanyData.dspID = dspID;

            userFields.userType = BUYER_COMPANY_USERTYPE;
        } else {
            userFields.userType = PUB_COMPANY_USERTYPE;
        }

        let newUserData = await this.createUser(userFields);
        newCompanyData.user = newUserData;

        await this.dbm.insert({ userID: newCompanyData.user.userID }).into('ixmCompanyWhitelist');

        if (dspID) {
            await this.dbm.insert({ userID: newCompanyData.user.userID, dspID: newCompanyData.dspID,
                                externalTradingDeskID: newCompanyData.user.userID * 2, buyerID: 123 }).into('rtbTradingDesks');
        }

        return newCompanyData;

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

        let siteIDs = await this.dbm.insert(newSiteData, [ 'siteID' ]).into('sites');
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

        // store the restriction mappings and remove them from the base object
        let mapEntities = {
            adUnits: null,
            countries: null,
            rtbDomainDepths: null
        };

        for (let key in mapEntities) {
            if (typeof newSectionData.section[key] !== 'undefined') {
                mapEntities[key] = newSectionData.section[key];
                delete newSectionData.section[key];
            }
        }

        let sectionID = await this.dbm.insert({
            userID: newSectionData.section.userID,
            name: newSectionData.section.name,
            status: newSectionData.section.status,
            percent: newSectionData.section.percent,
            entireSite: newSectionData.section.entireSite
        }, 'sectionID').into('rtbSections');

        newSectionData.section.sectionID = sectionID[0];
        Log.debug(`Created section ID: ${sectionID[0]}, ownerID: ${ownerID}`);
        newSectionData.siteIDs = siteIDs;

        await this.mapSectionToSites(newSectionData.section.sectionID, siteIDs);

        // if not entire site, generate some matches
        if (!newSectionData.section.entireSite &&
            (typeof newSectionData.section["matches"] === 'undefined' || newSectionData.section.matches.length === 0)) {

            // remove the matches from the main object if present
            if (typeof newSectionData.section["matches"] !== 'undefined') {
                delete newSectionData.section.matches;
            }

            let numMatches = Math.ceil(Math.random() * 10);
            Log.debug(`Create ${numMatches} matches for section ${newSectionData.section.sectionID}`);

            newSectionData.section.matches = await this.createSectionMatches(newSectionData.section.sectionID, numMatches);
        }

        let restrictions = {
            "adUnits": "adUnitID",
            "countries": "countryID",
            "rtbDomainDepths": "depthBucket"
        };

        for (let key in restrictions) {
            let restrictionSource = key;
            let restrictionID = restrictions[key];

            if (!mapEntities[restrictionSource] || mapEntities[restrictionSource].length === 0) {
                let restrictionIDs: number[] = await this.dbm.pluck(restrictionID).from(restrictionSource);
                let numRestrictions: number = Math.round(Math.random() * restrictionIDs.length);

                while (restrictionIDs.length > numRestrictions) {
                    restrictionIDs.splice(Math.floor(Math.random() * restrictionIDs.length), 1);
                }

                newSectionData.section[restrictionSource] = restrictionIDs;
            }

            await this.mapSectionToRestrictions(sectionID, newSectionData.section[restrictionSource], restrictionSource, restrictionID);
        }

        return newSectionData;

    }

    /**
     * Creates a new section match entities based on "new-section-match-schema", Inserts into "Viper2.rtbSectionMatches"
     * @param sectionID {int} - The section ID for this match
     * @param numMatches {int} - Optional: the number of matches to generate. If 
     * @param matchFields {INewMatchData} - Optional an array of new match objects to override random fields. Length should equal numMatches
     * @returns {Promise<INewMatchData>} - Promise which resolves with an object with new match data
     */
    public async createSectionMatches(sectionID: number, numMatches = 1, matchFields?: INewMatchData[]) {

        let newMatchObjects = [];
        for (let i = 0; i < numMatches; ++i) {
            let newMatchObj = this.generateDataObject<INewMatchData>('new-section-match-schema');
            newMatchObj.sectionID = sectionID;

            // Random chance of adding path segments onto the url
            if (Math.random() > 0.33) {
                let numPathSegments = Math.ceil(Math.random() * 3);

                for (let j = 0; j < numPathSegments; ++j) {
                    newMatchObj.url += '/' + faker.internet.domainWord();
                }
            }

            if (typeof matchFields !== 'undefined' && matchFields.length) {
                Object.assign(newMatchObj, matchFields[i]);
            }

            newMatchObjects.push(newMatchObj);
        }

        await this.dbm.insert(newMatchObjects).into('rtbSectionMatches');

        Log.debug(`Created ${numMatches} match objects for section ${sectionID}`);

        return newMatchObjects;
    }

    /**
     * Creates a new proposal entity based on "new-proposal-schema". Inserts into "Viper2.ixmDealProposals",
     * "Viper2.ixmProposalSectionMappings"
     * @param ownerID {int} - the userID of the proposal owner
     * @param sectionIDs {int[]} - an array of sectionIDs to be mapped to the new proposal
     * @param proposalFields {INewProposalData} - Optional: a new proposal object to override random fields
     * @param targetedUsers {int[]} - Optional: userIDs of targeted ixmUsers
     * @returns {Promise<INewProposalData>} - Promise which resolves with an object of new proposal data
     */
    public async createProposal(ownerID: number, sectionIDs: number[], proposalFields?: IProposal, targetedUsers?: number[]) {

        let newProposalObj = this.generateDataObject<IProposal>('new-proposal-schema');
        let newProposal: INewProposalData = { proposal: newProposalObj, sectionIDs: sectionIDs, targetedUsers: targetedUsers || [] };

        if (proposalFields) {
            Object.assign(newProposal.proposal, proposalFields);
        }

        newProposal.proposal.ownerID = ownerID;
        newProposal.proposal.ownerContactID = ownerID;
        newProposal.proposal.createDate = this.currentMidnightDate();

        if (typeof newProposal.proposal.startDate !== 'string') {
            newProposal.proposal.startDate.setHours(0, 0, 0, 0);
        }

        if (typeof newProposal.proposal.endDate !== 'string') {
            newProposal.proposal.endDate.setHours(0, 0, 0, 0);
        }

        let proposalID = await this.dbm.insert(newProposal.proposal, 'proposalID').into('ixmDealProposals');
        Log.debug(`Created proposal ID: ${proposalID[0]}`);
        newProposal.proposal.proposalID = proposalID[0];

        let modifyDate = await this.dbm.select('modifyDate').from('ixmDealProposals').where('proposalID', proposalID[0]);
        newProposal.proposal.modifyDate = modifyDate[0].modifyDate;

        await this.mapProposalToSections(newProposal.proposal.proposalID, newProposal.sectionIDs);

        if (newProposal.targetedUsers) {
            await this.mapProposalToTargets(newProposal.proposal.proposalID, newProposal.targetedUsers);
        }

        return newProposal;

    }

    /**
     * Creates a new section entry based on "new-negotiation-schema". Inserts into "Viper2.ixmDealNegotiations",
     * "Viper2.ixmDealNegotiations".
     * @param proposalID {int} - proposalID of the proposal being negotiated
     * @param ownerID {int} - ownerID to whom the proposal belongs to
     * @param partnerID {int} - partnerID of partner negotiating with owner
     * @returns {Promise<IDealNegotiationData>} - Promise which resolves with object of new section data
     */
    public async createDealNegotiation (proposalID: number, partnerID: number, optionalFields?: IDealNegotiationData) {

        let newDealNegotiationData = this.generateDataObject<IDealNegotiationData>('new-negotiation-schema');

        if (optionalFields) {
            Object.assign(newDealNegotiationData, optionalFields);
        }

        newDealNegotiationData.proposalID = proposalID;
        newDealNegotiationData.partnerID = partnerID;
        newDealNegotiationData.partnerContactID = partnerID;
        newDealNegotiationData.startDate.setHours(0, 0, 0, 0);
        newDealNegotiationData.endDate.setHours(0, 0, 0, 0);

        // Check if there are any differences between proposal and negotiation
        let proposals = await this.dbm.select().from('ixmDealProposals').where('proposalID', proposalID);

        let proposal = proposals[0];

        let negotiatedFields = {
            price: newDealNegotiationData.price,
            terms: newDealNegotiationData.terms,
            budget: newDealNegotiationData.budget,
            impressions: newDealNegotiationData.impressions,
            startDate: newDealNegotiationData.startDate,
            endDate: newDealNegotiationData.endDate
        };

        for (let key in negotiatedFields) {
            if (negotiatedFields[key] === proposal[key]) {
                newDealNegotiationData[key] = null;
            }
        }

        let newDealNegotiationIds = await this.dbm.insert(newDealNegotiationData, 'negotiationID').into('ixmDealNegotiations');

        newDealNegotiationData.negotiationID = newDealNegotiationIds[0];

        let selection = await this.dbm.select('createDate', 'modifyDate').from('ixmDealNegotiations')
                                    .where('negotiationID', newDealNegotiationData.negotiationID);

        newDealNegotiationData.modifyDate = selection[0].modifyDate;
        newDealNegotiationData.createDate = selection[0].createDate;

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
            let mapping = { proposalID: proposalID, sectionID: sectionIDs[i] };

            await this.dbm.insert(mapping).into('ixmProposalSectionMappings');
            Log.debug(`Mapped proposalID ${proposalID} to sectionID ${sectionIDs[i]}`);
        }

    }

    /**
     * Maps a proposal to 1 or more targeted users.
     * @arg proposalID {int} - the proposalID to map
     * @arg targets {int[]} - an array of userIDs to map to the given proposalID
     * @returns {Promise<void>} Promise that resolves when all mappings done
     */
    public async mapProposalToTargets(proposalID: number, targets: number[]) {

        for (let i = 0; i < targets.length; i += 1) {
            let mapping = { proposalID: proposalID, userID: targets[i] };

            await this.dbm.insert(mapping).into('ixmProposalTargeting');
            Log.debug(`Mapped proposalID ${proposalID} to target user ${targets[i]}`);
        }

    }

    /**
     * Creates mapping entry in "Viper2.rtbSiteSections"
     * @arg sectionID {int} - the sectionID of the section to map
     * @arg siteIDs {int[]} - an array of siteIDs to map to sectionID
     * @returns {Promise<void>} Resolves when all mapping entries have been successful
     */
    public async mapSectionToSites(sectionID: number, siteIDs: number[]) {
        let mappings = [];

        for (let i = 0; i < siteIDs.length; i += 1) {
            let mapping = { sectionID: sectionID, siteID: siteIDs[i] };
            mappings.push(mapping);
        }

        await this.dbm.insert(mappings).into('rtbSiteSections');

        Log.debug(`Mapped sectionID ${sectionID} to siteIDs ${siteIDs.join(', ')}`);
    }

    /**
     * Maps sections to adUnit, country, and depth tables
     * @arg sectionID {int} - the sectionID of the section to map
     * @arg restrictionIDs {int[] | string[]} - the adUnitID to map
     * @arg restrictionSource {string} - the restriction source table
     * @arg restrictionID {string} - the restriction ID column
     * @returns {Promise<void>} - Resolves when all mapping entries are successful
     */
    public async mapSectionToRestrictions(sectionID: number, restrictionIDs: number[] | string[], restrictionSource: string,
                                            restrictionID: string) {
        let mappings: Object[] = [];

        let restrictionTable = '';
        if (restrictionSource === 'adUnits') {
            restrictionTable = 'sectionAdUnitMappings';
        } else if (restrictionSource === 'countries') {
            restrictionTable = 'sectionCountryMappings';
        } else if (restrictionSource === 'rtbDomainDepths') {
            restrictionTable = 'sectionDepthMappings';
        }

        // Viper2.countries uses 'countryID', but sectionCountryMappings uses 'countryCode'
        if (restrictionID === 'countryID') {
            restrictionID = 'countryCode';
        }

        for (let i = 0; i < restrictionIDs.length; ++i) {
            let mapping = { sectionID: sectionID };
            mapping[restrictionID] = restrictionIDs[i];
            mappings.push(mapping);
        }

        await this.dbm.insert(mappings).into(restrictionTable);

        Log.debug(`Mapped sectionID ${sectionID} to ${restrictionID} ${restrictionIDs.join(', ')}`);
    }

    /**
     * Creates a new entry in rtbDeals based on "new-settleddeal-schema". Inserts into "Viper2.deals",
     * "Viper2.rtbDealSections", "Viper2.ixmNegotiationDealMappings"
     * @param userID {int} - the userID of the deal's creator
     * @param sectionIDs {int[]} - an array of sectionIDs to be mapped to the new deal
     * @param negotiationID {int} - a negotiationID to be mapped to the new deal
     * @param [settledDealFields] {ISettledDeal} - Optional: a new deal object to override random fields
     * @returns {Promise<ISettledDealData>} - Promise which resolves with an object of new deal data
     */
    public async createSettledDeal(userID: number, sectionIDs: number[], negotiationID: number, settledDealFields?: ISettledDeal) {

        let newSettledDealObj = this.generateDataObject<ISettledDeal>('new-settleddeal-schema');
        let newSettledDeal: ISettledDealData = { settledDeal: newSettledDealObj, sectionIDs: sectionIDs, negotiationID: negotiationID };

        if (settledDealFields) {
            Object.assign(newSettledDeal.settledDeal, settledDealFields);
        }

        newSettledDeal.settledDeal.userID = userID;
        newSettledDeal.settledDeal.startDate.setHours(0, 0, 0, 0);
        newSettledDeal.settledDeal.endDate.setHours(0, 0, 0, 0);
        newSettledDeal.settledDeal.modifiedDate = new Date();

        let dealID = await this.dbm.insert(newSettledDeal.settledDeal, 'dealID').into('rtbDeals');
        Log.debug(`Created settled deal ID: ${dealID[0]}`);
        newSettledDeal.settledDeal.dealID = dealID[0];

        // modifiedDate changes slightly while inserted in DB... fetch DB value
        let modifiedDateObj = await this.dbm.select('modifiedDate').from('rtbDeals').where('dealID', dealID[0]);
        newSettledDeal.settledDeal.modifiedDate = modifiedDateObj[0].modifiedDate;

        await this.mapSettledDealToSections(newSettledDeal.settledDeal.dealID, newSettledDeal.sectionIDs);
        await this.mapSettledDealToNegotiation(newSettledDeal.settledDeal.dealID, newSettledDeal.negotiationID);

        let createdDateObj = await this.dbm.select('createDate').from('ixmNegotiationDealMappings').where('dealID', dealID[0]);
        newSettledDeal.settledDeal.createDate = createdDateObj[0].createDate;

        return newSettledDeal;

    }

    /**
     * Creates mapping entry in "Viper2.rtbDealSections"
     * @arg dealID {int} - the dealID of the deal to map
     * @arg sectionIDs {int[]} - an array of sectionIDs to map to dealID
     * @returns {Promise<void>} Resolves when all mapping entries have been successful
     */
    public async mapSettledDealToSections(dealID: number, sectionIDs: number[]) {
        let mappings = [];

        for (let i = 0; i < sectionIDs.length; i += 1) {
            let mapping = { dealID: dealID, sectionID: sectionIDs[i] };
            mappings.push(mapping);
        }

        await this.dbm.insert(mappings).into('rtbDealSections');

        for (let i = 0; i < sectionIDs.length; i += 1) {
            Log.debug(`Mapped dealID ${dealID} to sectionID ${sectionIDs[i]}`);
        }
    }

    /**
     * Creates mapping entry in "Viper2.ixmNegotiationDealMappings"
     * @arg dealID {int} - the dealID of the deal to map
     * @arg negotiationID {int} - a negotiationID to map to dealID
     * @returns {Promise<void>} Resolves when all mapping entries have been successful
     */
    public async mapSettledDealToNegotiation(dealID: number, negotiationID: number) {
        let mapping = { dealID: dealID, negotiationID: negotiationID, createDate: null };

        await this.dbm.insert(mapping).into('ixmNegotiationDealMappings');

        Log.debug(`Mapped dealID ${dealID} to negotiationID ${negotiationID}`);
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

        let data: T = jsf(schema);
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

    private currentMidnightDate(): Date {
        let date = new Date();
        date.setHours(0, 0, 0, 0);

        return date;
    }

}

export { DatabasePopulator }
