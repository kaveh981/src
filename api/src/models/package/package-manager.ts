'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';
import { PackageModel } from './package-model';
import { ContactManager } from '../contact-info/contact-manager';

const Log = new Logger('mPKG');

/** Package model manager */
class PackageManager {

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /** To populate the contact info */
    private contactManager: ContactManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager, contactManager: ContactManager) {
        this.dbm = database;
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
                packageObject = new PackageModel(info);
                return this.getPackageSections(packageID);
            })
            .then((sections) => {
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
        return this.dbm.select('packageID')
                .from('ixmPackages')
                .where('name', packageName)
            .then((packageIDs: any) => {
                return this.fetchPackageFromId(packageIDs[0].packageID);
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Get list of objects by status
     * @param packageStatus - status of the package, a enum value which could be active, paused or deleted
     * @returns Returns an array of package objects by the given status
     */
    public fetchPackagesFromStatus(packageStatus: string, pagination: any): Promise<any> {
        return this.dbm.select('packageID')
                .from('ixmPackages')
                .where('status', packageStatus)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .then((idObjects: any) => {
                return Promise.map(idObjects, (idObject: any) => {
                    return this.fetchPackageFromId(idObject.packageID);
                });
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Get list of objects by owner
     * @param packageOwner - ID of the package's owner
     * @returns Returns an array of package objects by the given owner
     */
    public fetchPackagesFromOwner(packageOwner: number, pagination: any): Promise<any> {
        return this.dbm.select('packageID')
                .from('ixmPackages')
                .where('ownerID', packageOwner)
                .limit(pagination.limit)
                .offset(pagination.offset)
            .then((idObjects: any) => {
                return Promise.map(idObjects, (idObject: any) => {
                    return this.fetchPackageFromId(idObject.packageID);
                });
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Get package information by package ID
     * @param packageID - the ID of the package
     * @returns Returns an object include all the information of the package 
     */
    private getPackageInfo(packageID: number): Promise<any> {
        let packageInfo: IPackageModel;

        return this.dbm.select('packageID', 'ownerID', 'name', 'description', 'status', 'public', 'startDate',
                    'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate', 'modifyDate')
                .from('ixmPackages')
                .where('packageID', packageID)
            .then((info: any) => {
                packageInfo = info[0];
                return this.contactManager.fetchContactInfoById(packageInfo.ownerID);
            })
            .then((contact) => {
                packageInfo.ownerContactInfo = contact;
                return packageInfo;
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Get corresponding section IDs by package ID
     * @param packageID - the ID of the package
     * @returns Returns an array of section IDs
     */
    private getPackageSections(packageID: number): Promise<number []> {
        return this.dbm.select('sectionID')
                .from('ixmPackageSectionMappings')
                .where('packageID', packageID)
            .then((sectionObjects: any) => {
                return sectionObjects.map((sectionObject) => { return sectionObject.sectionID; });
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // /**
    //  * Insert package and section mappings into database
    //  * @param packageID - the ID of the package
    //  * @param sectionID - the ID of the section
    //  * @returns Returns a array with number 0 inside
    //  */
    // private insertPackageSectionMappings (packageID: number, sectionID: number): Promise<any> {
    //      return this.dbm.insert({
    //            packageID: packageID,
    //            sectionID: sectionID
    //         })
    //         .into('ixmPackageSectionMappings')
    //         .catch((err: Error) => {
    //             Log.error(err.toString());
    //             throw err;
    //         });
    // }

        // /**
    //  * Add a package and related mappings to database
    //  * @param newPackage - package object includes corresponding sections
    //  * @returns undefined
    //  */
    // public savePackage (newPackage: any): Promise<any> {
    //     return this.dbm.insert({
    //             ownerID: newPackage.ownerID,
    //             name: newPackage.name,
    //             description: newPackage.description,
    //             status: newPackage.status,
    //             public: newPackage.isPublic,
    //             startDate: newPackage.startDate,
    //             endDate: newPackage.endDate,
    //             price: newPackage.price,
    //             impressions: newPackage.impressions,
    //             budget: newPackage.budget,
    //             auctionType: newPackage.auctionType,
    //             terms: newPackage.terms,
    //             createDate: newPackage.createDate
    //         })
    //         .into('ixmPackages')
    //         .then((newPackageID: any) => {
    //             return Promise.each(newPackage.sections, (sectionID: number) => {
    //                 this.insertPackageSectionMappings(newPackageID[0], sectionID);
    //             });
    //         })
    //         .catch((err: Error) => {
    //             Log.error(err.toString());
    //             throw err;
    //         });
    // }

}

export { PackageManager };
