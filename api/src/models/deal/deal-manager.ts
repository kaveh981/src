'use strict';

import * as Promise from 'bluebird';

import { DealModel } from './deal-model';

import { DatabaseManager } from '../../lib/database-manager';
import { PackageManager } from '../../models/package/package-manager';
import { ContactManager } from '../../models/contact-info/contact-manager';
import { BuyerManager } from '../../models/buyer/buyer-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mDLS');

/** Deal model manager */
class DealManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** Internal package manager */
    private packageManager: PackageManager;

    /** Internal contact manager */
    private contactManager: ContactManager;

    /** Internal buyer manager */
    private buyerManager: BuyerManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager, packageManager: PackageManager,
        contactManager: ContactManager, buyerManager: BuyerManager) {
        this.databaseManager = databaseManager;
        this.packageManager = packageManager;
        this.contactManager = contactManager;
        this.buyerManager = buyerManager;
    }

    /**
     * Returns a deal model from an id
     * @param id - The id of the deal we want information from.
     */
    public fetchDealFromId(id: number): Promise<DealModel> {
        let deal: DealModel;

        return this.databaseManager.select('rtbDeals.dealID as dealID', 'userID as publisherID', 'dspID',
                    'name', 'auctionType', 'status', 'startDate', 'endDate', 'externalDealID as externalID',
                    this.databaseManager.raw('GROUP_CONCAT(sectionID) as sections') )
                .from('rtbDeals')
                .join('rtbDealSections', 'rtbDeals.dealID', 'rtbDealSections.dealID')
                .where('rtbDeals.dealID', id)
                .groupBy('rtbDeals.dealID')
            .then((deals: any) => {
                deals[0].sections = deals[0].sections.split(',');
                deal = new DealModel(deals[0]);
                return deal.publisherID;
            })
            .then((theId) => {
                return this.contactManager.fetchContactInfoFromId(theId);
            })
            .then((contactInfo) => {
                deal.publisherContact = contactInfo;
                return deal;
            });
    }

    /**
     * Returns all active deals for a certain buyer 
     * @param buyerId - The id of the buyer we need to find active deals for
     * @param pagination - Pagination details for the request
     */
    public fetchActiveDealsFromBuyerId(buyerID: number, pagination: any): Promise<any> {
        /* TODO: This select statement will need to obtain information that was accepted by both the pub and buyer (i.e. latest
            terms, impressions, start and end dates, etc.). Therefore, it will have to interact with the DealNegotiations table 
            to get that info (i.e. get the info from the row that indicates a pubStatus=accepted and buyerStatus=accepted and 
            which has the latest modified date).*/
        return this.databaseManager.select('rtbDeals.dealID', 'ixmPackages.packageID', 'ixmPackages.ownerID', 'rtbDeals.externalDealID',
                    'rtbDeals.name', 'ixmPackages.description', 'rtbDeals.startDate', 'rtbDeals.endDate', 'ixmPackages.price',
                    'ixmPackages.impressions', 'ixmPackages.budget', 'rtbDeals.auctionType', 'ixmPackages.terms', 'rtbDeals.modifiedDate')
                .from('rtbDeals')
                .join('ixmPackageDealMappings', 'rtbDeals.dealID', 'ixmPackageDealMappings.dealID')
                .join('ixmPackages', 'ixmPackageDealMappings.packageID', 'ixmPackages.packageID')
                .where('rtbDeals.status', 'A')
                .andWhere('dspID', buyerID)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .then((deals: any) => {
                return Promise.map(deals, (deal: any) => {
                    return this.packageManager.fetchPackageFromId(deal.packageID)
                        .then((fetchedPackage) => {
                            return Object.assign(deal, {sections: fetchedPackage.sections});
                        });
                });
            });
    }

    /**
     * Gets the deal associated with a buyer's DSP and a specific package, if it exists
     * @param packageID - the ID of the package is question
     * @param buyerID - the ID of the buyer in question
     */
    public fetchExistingDealWithBuyerDSP(packageID: number, buyerID: number): Promise<any> {
        let deal: DealModel;

        return this.buyerManager.getDSPsFromId(buyerID)
            .then((dsp) => {
                let dspID = dsp[0].dspid;
                return this.databaseManager.select('rtbDeals.dealID')
                        .from('rtbDeals')
                        .join('ixmPackageDealMappings', 'rtbDeals.dealID', 'ixmPackageDealMappings.dealID')
                        .where('dspID', dspID)
                        .andWhere('packageID', packageID)
                    .then((result) => {
                        if (result.length > 0) {
                            return this.fetchDealFromId(result[0].dealID);
                        } else {
                            return null;
                        }
                    });
            });
    }

    /**
     * Creates a new deal in the database and creates any relevant mappings for a buyer and a package
     * @param buyerID - ID of the buyer in question
     * @param acceptedPackage - PackageModel object containing information about the accepted package
     */
    public saveDealForBuyer = Promise.coroutine(function* (buyerID: number, acceptedPackage: any) {
        // Get buyer's dspID
        let buyerDsp: number = (yield this.buyerManager.getDSPsFromId(buyerID))[0].dspid;

        // Generate external deal ID
        let externalDealID = 'ixm-' + acceptedPackage.packageID + '-' + buyerDsp;

        // Insert new deal into rtbDeals
        yield this.databaseManager.insert({
            userID: acceptedPackage.ownerID,
            dspID: buyerDsp,
            name: acceptedPackage.name,
            auctionType: acceptedPackage.auctionType,
            rate: acceptedPackage.price,
            status: 'A',
            startDate: acceptedPackage.startDate,
            endDate: acceptedPackage.endDate,
            externalDealID: externalDealID,
            priority: 0,
            openMarket: 0,
            noPayoutMode: 0,
            manualApproval: 1
        })
        .into('rtbDeals');

        // Get the new deal ID using the externalDealID because Knex doesn't return what it inserted for MySQL
        let newDealID = (yield this.databaseManager.select('dealID')
            .from('rtbDeals')
            .where('externalDealID', externalDealID))[0].dealID;

        // Insert deal section mappings
        for (let i = 0; i < acceptedPackage.sections.length; i++) {
            yield this.databaseManager.insert({
                dealID: newDealID,
                sectionID: acceptedPackage.sections[i]
            })
            .into('rtbDealSections');
        }

        // Insert package deal mapping
        yield this.databaseManager.insert({
            packageID: acceptedPackage.packageID,
            dealID: newDealID
        })
        .into('ixmPackageDealMappings');

        // Insert buyer deal mapping
        yield this.insertBuyerDealMapping(buyerID, newDealID);

        // Return inserted deal
        let newDeal = yield this.fetchDealFromId(newDealID);
        return newDeal;

    }.bind(this)) as (buyerID: number, acceptedPackage: any) => Promise<DealModel>;

    /**
     * Inserts a new mapping between a buyer and a deal in the database
     * @param buyerID - the ID of the buyer in question
     * @param dealID - the ID of the deal in question
     */
    public insertBuyerDealMapping(buyerID: number, dealID: number): Promise<any> {
        return this.databaseManager.insert({
            userID: buyerID,
            dealID: dealID
        })
        .into('ixmBuyerDealMappings');
    }
}

export { DealManager };
