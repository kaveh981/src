'use strict';

import * as Promise from 'bluebird';

import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log: Logger = new Logger('PKGM');

/**
 * Interface for package of deal negotiation
 */
interface IPackage {
    /** ID of the package */
    packageID: number;
    /** ID of the package's owner, corresponding to users in database */
    ownerID: number;
    /** Name of the package, unique value */
    name: string;
    /** Description of the package */
    description: string;
    /** Status of the packge, which could only be active, paused or deleted */
    status: string;
    /** Flag to define is the package viewable to public */
    isPublic: number;
    /** Start date of the package */
    startDate: string;
    /** End date of the package */
    endDate: string;
    /** Price of the package */
    price: number;
    /** Projected amout of impressions for the package */
    impressions: number;
    /** Project amount to be spend by the buyer */
    budget: number;
    /** Auction type of the deal, which could only be first, second or fixed */
    auctionType: string;
    /** Free text that both parties can edit to convene of specific deal conditions */
    terms: string;
    /** Created date of the package */
    createDate: string;
    /** Modified date of the package */
    modifiyDate: string;
    /** Array of sectionsID associated with the package*/
    sections: number[];
//  deals:number[]
}

/**
 * Class encapsulates functions related to ixmPackages
 */
class PackageModel {

    /**
     * Get package object by ID
     * @param packageID - the ID of the package
     * @returns Returns a package object includes associated section IDs
     */
    public static getPackageFromID (packageID: number): Promise<IPackage> {
        return PackageModel.getPackageInfo(packageID)
            .then((packageInfo: any) => {
                return PackageModel.getPackageSections(packageID)
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
    public static getPackageFromName (packageName: string): Promise<IPackage> {
        return DatabaseManager.select('packageID')
            .from('ixmPackages')
            .where('name', packageName)
            .then((packageIDs: any) => {
                return PackageModel.getPackageFromID(packageIDs[0].packageID);
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
    public static getPackagesFromStatus (packageStatus: string): Promise<any> {
        return DatabaseManager.select('ixmPackages.packageID', 'ownerID', 'name', 'description', 'status', 'public',
                'startDate', 'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate',
                'modifyDate', DatabaseManager.raw('GROUP_CONCAT(ixmPackageSectionMappings.sectionID) AS sections'))
            .from('ixmPackages')
            .leftJoin('ixmPackageSectionMappings', 'ixmPackages.packageID', 'ixmPackageSectionMappings.packageID')
            .where('status', packageStatus)
            .groupBy('ixmPackages.packageID')
            .then((packages: any) => {
                packages.forEach((ixPackage: any) => {
                    ixPackage.sections = ixPackage.sections.split(',').map(Number);
                });
                return packages;
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
    public static getPackagesFromOwner (packageOwner: number): Promise<any> {
        return DatabaseManager.select('ixmPackages.packageID', 'ownerID', 'name', 'description', 'status', 'public',
                'startDate', 'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate',
                'modifyDate', DatabaseManager.raw('GROUP_CONCAT(ixmPackageSectionMappings.sectionID) AS sections'))
            .from('ixmPackages')
            .leftJoin('ixmPackageSectionMappings', 'ixmPackages.packageID', 'ixmPackageSectionMappings.packageID')
            .where('ownerID', packageOwner)
            .groupBy('ixmPackages.packageID')
            .then((packages: any) => {
                packages.forEach((ixPackage: any) => {
                    ixPackage.sections = ixPackage.sections.split(',').map(Number);
                });
                return packages;
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
    public static addPackage (newPackage: any): Promise<any> {
        return DatabaseManager.insert({
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
                    PackageModel.insertPackageSectionMappings(newPackageID[0], sectionID);
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
    private static getPackageInfo (packageID: number): Promise<any> {
        return DatabaseManager.select('packageID', 'ownerID', 'name', 'description', 'status', 'public', 'startDate',
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
    private static getPackageSections (packageID: number): Promise<number []> {
        return DatabaseManager.select('sectionID')
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
     * @param {number} - the ID of the section
     * @returns Returns a array with number 0 inside
     */
    private static insertPackageSectionMappings (packageID: number, sectionID: number): Promise<any> {
         return DatabaseManager.insert({
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

export { PackageModel }
