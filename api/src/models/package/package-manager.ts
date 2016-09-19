'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log = new Logger('mPKG');

/** Package model manager */
class PackageManager {

    /** Internal dbm  */
    private dbm: DatabaseManager;

    /**
     * Constructor
     * @param database - An instance of the database manager.
     */
    constructor(database: DatabaseManager) {
        this.dbm = database;
    }

    /**
     * Get package object by ID
     * @param packageID - the ID of the package
     * @returns Returns a package object includes associated section IDs
     */
    public getPackageFromID (packageID: number): Promise<IPackageModel> {
        return this.getPackageInfo(packageID)
            .then((packageInfo: any) => {
                return this.getPackageSections(packageID)
                    .then((sections: any) => {
                        return Object.assign(packageInfo, {sections: sections});
                    });
            });
    }

    /**
     * Get package object by name
     * @param packageName - the unique name of the package
     * @returns Returns a package object includes associated section IDs
     */
    public getPackageFromName (packageName: string): Promise<IPackageModel> {
        return this.dbm.select('packageID')
            .from('ixmPackages')
            .where('name', packageName)
            .then((packageIDs: any) => {
                return this.getPackageFromID(packageIDs[0].packageID);
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
    public getPackagesFromStatus (packageStatus: string): Promise<any> {
        return this.dbm.select('packageID')
            .from('ixmPackages')
            .where('status', packageStatus)
            .then((packageIDs: any) => {
                let listOfPackages: IPackageModel[];
                packageIDs.forEach((packageID: any) => {
                    this.getPackageFromID(packageID)
                    .then((packageObject: IPackageModel) => {
                        listOfPackages.push(packageObject);
                    });
                });
                return listOfPackages;
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
    public getPackagesFromOwner (packageOwner: number): Promise<any> {
        return this.dbm.select('packageID')
            .from('ixmPackages')
            .where('ownerID', packageOwner)
            .then((packageIDs: any) => {
                let listOfPackages: IPackageModel[];
                packageIDs.forEach((packageID: any) => {
                    this.getPackageFromID(packageID)
                    .then((packageObject: IPackageModel) => {
                        listOfPackages.push(packageObject);
                    });
                });
                return listOfPackages;
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Add a package and related mappings to database
     * @param newPackage - package object includes corresponding sections
     * @returns undefined
     */
    public addPackage (newPackage: any): Promise<any> {
        return this.dbm.insert({
                ownerID: newPackage.ownerID,
                name: newPackage.name,
                description: newPackage.description,
                status: newPackage.status,
                public: newPackage.isPublic,
                startDate: newPackage.startDate,
                endDate: newPackage.endDate,
                price: newPackage.price,
                impressions: newPackage.impressions,
                budget: newPackage.budget,
                auctionType: newPackage.auctionType,
                terms: newPackage.terms,
                createDate: newPackage.createDate
            })
            .into('ixmPackages')
            .then((newPackageID: any) => {
                return Promise.each(newPackage.sections, (sectionID: number) => {
                    this.insertPackageSectionMappings(newPackageID[0], sectionID);
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
    private getPackageInfo (packageID: number): Promise<any> {
        return this.dbm.select('packageID', 'ownerID', 'name', 'description', 'status', 'public', 'startDate',
                'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate', 'modifyDate')
            .from('ixmPackages')
            .where('packageID', packageID)
            .then((packageInfo: any) => {
                return packageInfo[0];
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
    private getPackageSections (packageID: number): Promise<number []> {
        return this.dbm.select('sectionID')
            .from('ixmPackageSectionMappings')
            .where('packageID', packageID)
            .then((sectionObjects: any) => {
                let sectionIDs: number[] = [];
                sectionObjects.forEach((sectionObject: any) => {
                    sectionIDs.push(sectionObject.sectionID);
                });
                return sectionIDs;
            })
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }

    /**
     * Insert package and section mappings into database
     * @param packageID - the ID of the package
     * @param sectionID - the ID of the section
     * @returns Returns a array with number 0 inside
     */
    private insertPackageSectionMappings (packageID: number, sectionID: number): Promise<any> {
         return this.dbm.insert({
               packageID: packageID,
               sectionID: sectionID
            })
            .into('ixmPackageSectionMappings')
            .catch((err: Error) => {
                Log.error(err.toString());
                throw err;
            });
    }
}

export { PackageManager };
