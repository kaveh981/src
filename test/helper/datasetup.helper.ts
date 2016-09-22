'use strict';
import * as Promise from 'bluebird';
import { Logger } from '../lib/logger';
import { Injector } from '../lib/injector';
import { DatabaseManager } from '../lib/database-manager';
import dataSetup from './dataSetup.config';

const Log = new Logger('mNEG');

class DataSetup {

    private dbm: DatabaseManager;

    constructor(dbm: DatabaseManager) {
        this.dbm = dbm;
    }

    public backupTable(table: string, postfix?: string): Promise<any> {
        postfix = postfix || "_bckp";

        let newtable: string = table + postfix;

        return this.dbm.raw('SHOW TABLES LIKE ?', [table])
            .then((res1) => {
                console.log(res1[0].length);
                if (res1[0].length === 0) {
                    Log.error("Target table: " + table + " is not found.");
                } else {
                    return this.dbm.raw("SHOW TABLES LIKE ?", [newtable])
                        .then((res2) => {
                            if (res2[0].length !== 0) {
                                Log.error("Backup table: " + newtable + " already exists.");
                            } else {
                                return this.dbm.raw("SET foreign_key_checks=0").then(() => {
                                    return this.dbm.raw("CREATE TABLE IF NOT EXISTS " + newtable + " SELECT * FROM " + table);
                                }).then(() => {
                                    return this.dbm.raw(" SET foreign_key_checks=1");
                                });
                            }
                        });
                }
            });
    }

    public restoreTable(table: string, postfix?: string): Promise<any> {
        postfix = postfix || "_bckp";

        let backup: string = table + postfix;
        let condition: string;
        let db: DatabaseManager = this.dbm;

        switch (table) {
            case "settings":
                // prevent the restore from overwriting API ASSET_DIR and STAGING_ASSET_DIR [TEST-109]
                condition = "WHERE name NOT LIKE '%ASSET_DIR'";
                break;
            default:
                condition = "";
        }

        // add leading space if a condition was specified, otherwise set to blank space
        condition = condition ? " " + condition : "";

        return db.raw("SHOW TABLES LIKE 'rtbBrandPlacementFloors_bckp'")
            .then((res) => {
                if (res[0].length === 0) {
                    console.log(res[0].length);
                    return Log.error('Backup table ' + backup + ' being restored are not found.');
                }
            })
            .then(() => {
                return db.raw("SHOW TABLES LIKE ?", [table]);
            })
            .then((res) => {
                if (res[0].length === 0) {
                    return Log.error('Live table ' + table + ' being restored are not found.');
                }
            })
            .then(() => {
                return db.raw("SET foreign_key_checks=0").then(() => {
                        return db.raw("DELETE FROM " + table + condition);
                    })
                    .then(() => {
                        return db.raw("INSERT INTO " + table + " SELECT * FROM " + backup + condition);
                    })
                    .then(() => {
                        return db.raw("DROP TABLE " + backup);
                    })
                    .then(() => {
                        return db.raw("SET foreign_key_checks=1");
                    });
            })
            .then(() => {
                return undefined;
            });
    }

    public clearTable(table: string): Promise<any> {

        return this.dbm.raw("SET foreign_key_checks=0").then(() => {
                return this.dbm.raw("DELETE FROM " + table);
            })
            .then(() => {
                return this.dbm.raw("SET foreign_key_checks=1");
            })
            .then(() => {
                return undefined;
            });
    };

}

export {DataSetup};
