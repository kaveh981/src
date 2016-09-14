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
    status: string; //enum
    publicPackage: number;
    startDate: string;
    endDate: string;
    price: number;
    impressions: number;
    budget: number;
    auctionType: string; //enum
    terms: string;
    createdDate: string;
    modifiedDate: string;
    sections: number[];
//  deals:number[]
}

class PackageModel {

    // Get package object includes associated sections
    public static getPackageFromID (packageID: number): Promise<IPackage> {
        return PackageModel.getPackageInfo(packageID)
            .then((packageInfo: any) => {
                return PackageModel.getPackageSections(packageID)
                .then((sections: any) => {
                    return Object.assign(packageInfo[0], {sections: sections})
                });
            });
    }

    // Get package from its name and sections associated with the package
    public static getPackageFromName (packageName: string): Promise<IPackage> {
        return DatabaseManager.select('packageID')
            .from('ixmPackages')
            .where('name', packageName)
            .then((packageIDs: any) => {
                return PackageModel.getPackageFromID(packageIDs[0])
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    public static getPackagesFromOwner (packageOwner: string): Promise<any> {
        return DatabaseManager.select('packageID')
            .from('ixmPackages')
            .where('owner', packageOwner)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    }

    public static getPackagesFromStatus (packageStatus: string): Promise<any> {
        return DatabaseManager.select('packageID')
            .from('ixmPackages')
            .where('status', packageStatus)
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
    } 
    
    public static addPackage (newPackage: IPackage): Promise<any> {
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
                coreateDate: newPackage.createdDate
            })
            .into('ixmPackages')
            .then(() => {
                newPackage.sections.forEach((sectionID: number) => {
                    DatabaseManager.insert({
                        packageID: newPackage.packageID,
                        sectionID: sectionID
                    })
                    .into('ixmPackageSectionMappings')
                })
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
             
    }

    // Get package information from ID
    public static getPackageInfo (packageID: number): Promise<any> {
        return DatabaseManager.select('packageID', 'ownerID', 'name', 'description', 'status', 'public', 'startDate',
                'endDate', 'price', 'impressions', 'budget', 'auctionType', 'terms', 'createdDate', 'modifiedDate')
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

    public static getPackageSections (packageID: number): Promise<any> {
        return DatabaseManager.select('sectionID')
            .from('ixmPackageSectionMappings')
            .where('packageID', packageID)
            .then((sectionObjects: any) => {
                sectionObjects.forEach()
            })
            .catch((err: ErrorEvent) => {
                Log.error(err.toString());
                throw err;
            });
               
    }

}

export { PackageModel }
