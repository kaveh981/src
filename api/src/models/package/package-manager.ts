'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { PackageModel } from './package-model';
import { ContactManager } from '../contact-info/contact-manager';
import { BuyerManager } from '../buyer/buyer-manager';

const Log = new Logger('mPKG');

/** Package model manager */
class PackageManager {

    /** Internal databaseManager  */
    private databaseManager: DatabaseManager;

    /** To populate the contact info */
    private contactManager: ContactManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(databaseManager: DatabaseManager, contactManager: ContactManager) {
        this.databaseManager = databaseManager;
        this.contactManager = contactManager;
    }

    /**
     * Get package object by ID
     * @param packageID - the ID of the package
     * @returns Returns a package object includes associated section IDs
     */
    public fetchPackageFromId(packageID: number): Promise<any> {
        let packageObject: PackageModel;

        return this.getPackageInfo(packageID)
            .then((info) => {
                if (!info) {
                    return;
                }
                packageObject = new PackageModel(info);
                return this.getPackageSections(packageID);
            })
            .then((sections) => {
                if (!sections) {
                    return;
                }
                packageObject.sections = sections;
                return packageObject;
            });
    }

    /**
     * Get package object by name
     * @param packageName - the unique name of the package
     * @returns Returns a package object includes associated section IDs
     */
    public fetchPackageFromName(packageName: string): Promise<PackageModel> {
        return this.databaseManager.select('packageID')
                .from('ixmPackages')
                .where('name', packageName)
            .then((packageIDs: any) => {
                return this.fetchPackageFromId(packageIDs[0].packageID);
            });
    }

    /**
     * Get list of objects by status
     * @param packageStatus - status of the package, a enum value which could be active, paused or deleted
     * @returns Returns an array of package objects by the given status
     */
    public fetchPackagesFromStatus(packageStatus: string, pagination: any): Promise<any> {
        return this.databaseManager.select('packageID')
                .from('ixmPackages')
                .where('status', packageStatus)
                .limit(Number(pagination.limit))
                .offset(Number(pagination.offset))
            .then((idObjects: any) => {
                return Promise.map(idObjects, (idObject: any) => {
                    return this.fetchPackageFromId(idObject.packageID);
                });
            });
    }

    /**
     * Get list of objects by owner
     * @param packageOwner - ID of the package's owner
     * @returns Returns an array of package objects by the given owner
     */
    public fetchPackagesFromOwner(packageOwner: number, pagination: any): Promise<any> {
        return this.databaseManager.select('packageID')
                .from('ixmPackages')
                .where('ownerID', packageOwner)
                .limit(Number(pagination.limit))
                .offset(Number(pagination.offset))
            .then((idObjects: any) => {
                return Promise.map(idObjects, (idObject: any) => {
                    return this.fetchPackageFromId(idObject.packageID);
                });
            });
    }

    /**
     * Checks if a package has already been purchased by a specific buyer
     * @param packageID - the ID of the package in question
     * @param buyerID - the ID of the buyer in question
     * @returns true if the package was already bought, false otherwise
     */
    public isPackageMappedToBuyer(packageID: number, buyerID: number): Promise<any> {
        return this.databaseManager.select()
                .from('ixmBuyerDealMappings')
                .join('ixmPackageDealMappings', 'ixmBuyerDealMappings.dealID', 'ixmPackageDealMappings.dealID')
                .where('userID', buyerID)
                .andWhere('packageID', packageID)
            .then((result) => {
                return result.length > 0;
            });
    }

    /**
     * Get package information by package ID
     * @param packageID - the ID of the package
     * @returns Returns an object include all the information of the package 
     */
    private getPackageInfo(packageID: number): Promise<any> {
        let packageInfo: PackageModel;

        return this.databaseManager.select('packageID', 'ownerID', 'name', 'description', 'status', 'accessMode', 'startDate',
                    'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate', 'modifyDate')
                .from('ixmPackages')
                .where('packageID', packageID)
            .then((info: any) => {
                packageInfo = info[0];
                if (!packageInfo) {
                    return;
                }
                return this.contactManager.fetchContactInfoFromId(packageInfo.ownerID);
            })
            .then((contact) => {
                if (!contact) {
                    return;
                }
                packageInfo.ownerContactInfo = contact;
                return packageInfo;
            });
    }

    /**
     * Get corresponding section IDs by package ID
     * @param packageID - the ID of the package
     * @returns Returns an array of section IDs
     */
    private getPackageSections (packageID: number): Promise<number[]> {
        return this.databaseManager.select('sectionID')
                .from('ixmPackageSectionMappings')
                .where('packageID', packageID)
            .then((sectionObjects: any) => {
                return sectionObjects.map((sectionObject) => { return sectionObject.sectionID; });
            });
    }

}

export { PackageManager };
