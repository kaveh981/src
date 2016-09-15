'use strict';

import * as Promise from 'bluebird';
import { DatabaseManager } from '../../lib/database-manager';
import { Logger } from '../../lib/logger';

const Log: Logger = new Logger('IXMPKG');

// Interface of a package
interface IPackage {
    packageID: number;
    ownerID: number;
    name: string;
    description: string;
    status: string;
    publicPackage: number;
    startDate: string;
    endDate: string;
    price: number;
    impressions: number;
    budget: number;
    auctionType: string;
    terms: string;
    createDate: string;
    modifiyDate: string;
    sections: number[];
//  deals:number[]
}

// Class encapsulates functions related to ixmPackages
class PackageModel {

    // Get package object includes associated sections
    public static getPackageFromID (packageID: number): Promise<IPackage> {
        return PackageModel.getPackageInfo(packageID)
            .then((packageInfo: any) => {
                return PackageModel.getPackageSections(packageID)
                .then((sections: any) => {
                    return Object.assign(packageInfo, {sections: sections});
                });
            });
    }

    // Get package from its name and sections associated with the package
    public static getPackageFromName (packageName: string): Promise<IPackage> {
        return DatabaseManager.select('packageID')
            .from('ixmPackages')
            .where('name', packageName)
            .then((packageIDs: any) => {
                return PackageModel.getPackageFromID(packageIDs[0].packageID)
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Get all packages with the given status, the return value is an array of package objects
    public static getPackagesFromStatus (packageStatus: string): Promise<any> {
        return DatabaseManager.select('ixmPackages.packageID', 'ownerID', 'name', 'description', 'status', 'public', 
                'startDate','endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate',
                'modifyDate', DatabaseManager.raw('GROUP_CONCAT(ixmPackageSectionMappings.sectionID) AS sections'))
            .from('ixmPackages')
            .leftJoin('ixmPackageSectionMappings', 'ixmPackages.packageID', 'ixmPackageSectionMappings.packageID')
            .where('status', packageStatus)
            .groupBy('ixmPackages.packageID')
            .then((packages: any) => {
                packages.forEach((ixPackage: any) => {
                    ixPackage.sections = ixPackage.sections.split(',').map(Number);
                })
                return packages;
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Get all packages with the given status, the return value is an array of package objects 
    public static getPackagesFromOwner (packageOwner: number): Promise<any> {
        return DatabaseManager.select('ixmPackages.packageID', 'ownerID', 'name', 'description', 'status', 'public', 
                'startDate','endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate',
                'modifyDate', DatabaseManager.raw('GROUP_CONCAT(ixmPackageSectionMappings.sectionID) AS sections'))
            .from('ixmPackages')
            .leftJoin('ixmPackageSectionMappings', 'ixmPackages.packageID', 'ixmPackageSectionMappings.packageID')
            .where('ownerID', packageOwner)
            .groupBy('ixmPackages.packageID')
            .then((packages: any) => {
                packages.forEach((ixPackage: any) => {
                    ixPackage.sections = ixPackage.sections.split(',').map(Number);
                })
                return packages;
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }
    
    // Add a package and related mappings of sections 
    public static addPackage (newPackage: any): Promise<any> {
        return DatabaseManager.insert({
                ownerID: newPackage.ownerID, 
                name: newPackage.name, 
                description: newPackage.description,
                status: newPackage.status, 
                public: newPackage.publicPackage, 
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
                Promise.each(newPackage.sections, (sectionID: number) => {
                    DatabaseManager.insert({
                        packageID: newPackageID[0],
                        sectionID: sectionID
                    })
                    .into('ixmPackageSectionMappings')
                    .then((value: any) => {
                        console.log(value);
                    })
                })
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });          
    }

    // Get package information from ID
    private static getPackageInfo (packageID: number): Promise<any> {
        return DatabaseManager.select('packageID', 'ownerID', 'name', 'description', 'status', 'public', 'startDate',
                'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createDate', 'modifyDate')
            .from('ixmPackages')
            .where('packageID', packageID)
            .then((packageInfo) => {
                return packageInfo[0];
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    // Get array of sections associated to a package
    private static getPackageSections (packageID: number): Promise<number []> {
        return DatabaseManager.select('sectionID')
            .from('ixmPackageSectionMappings')
            .where('packageID', packageID)
            .then((sectionObjects: any) => {
                let sectionIDs: number[] = [];
                sectionObjects.forEach((sectionObject: any) => {
                    sectionIDs.push(sectionObject.sectionID);
                })
                return sectionIDs;
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });          
    }
}

export { PackageModel }
