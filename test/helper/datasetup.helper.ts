import { DatabaseManager } from '../lib/database-manager';
import { Logger } from '../lib/logger';
import dataSetup from './dataSetup.config'

const Log = new Logger('mNEG');
class DataSetup {
    private dbm:DatabaseManager;

    constructor(dbm:DatabaseManager) {
        this.dbm = dbm;
    }

    backupTable(table:string, postfix?:string):any {
        postfix = postfix || "_bckp";

        let query:string,
            newtable:string = table + postfix;

        query = "SET foreign_key_checks=0;" +
            "CREATE TABLE IF NOT EXISTS " + newtable + " SELECT * FROM " + table + ";" +
            "SET foreign_key_checks=1;";

        return this.dbm.raw('SHOW TABLES LIKE ?', [table])
            .then((res) => {
                if (res.length === 0) {
                    Log.error("Target table: " + table + " is not found.");
                } else {
                    return this.dbm.raw("SHOW TABLES LIKE ?", [newtable])
                        .then((res) => {
                            if (res.length !== 0) {
                                Log.error("Backup table: " + newtable + " already exists.");
                            } else {
                                return this.dbm.raw(query);
                            }
                        });
                }
            });
    }

    restoreTable(table:string, postfix?:string) {
        postfix = postfix || "_bckp";

        let backup = table + postfix,
            query,
            condition,
            db = this.dbm;

        switch (table) {
            case "settings":
                //prevent the restore from overwriting API ASSET_DIR and STAGING_ASSET_DIR [TEST-109]
                condition = "WHERE name NOT LIKE '%ASSET_DIR'";
                break;
        }

        //add leading space if a condition was specified, otherwise set to blank space
        condition = condition ? " " + condition : "";

        query = "SET foreign_key_checks=0;" +
            "DELETE FROM " + table + condition + ";" +
            "INSERT INTO " + table + " SELECT * FROM " + backup + condition + ";" +
            "DROP TABLE " + backup + ";" +
            "SET foreign_key_checks=1;";

        return db.raw("SHOW TABLES LIKE '" + backup + "';")
            .then(function (res) {
                if (res.length !== 1) {
                    return Log.error('Backup table ' + backup + ' being restored are not found.');
                }
            })
            .then(function () {
                return db.raw("SHOW TABLES LIKE '" + table + "';");
            })
            .then(function (res) {
                if (res.length !== 1) {
                    return Log.error('Live table ' + table + ' being restored are not found.');
                }
            })
            .then(function () {
                return db.raw(query);
            })
            .then(function () {
                return undefined;
            });
    }

    clearTable(table) {

        let query:string = "SET foreign_key_checks=0;" + "DELETE FROM " + table + ";";
        query = query + "SET foreign_key_checks=1;";

        return this.dbm.raw(query)
            .then(function () {
                return undefined;
            });
    };


}

export {DataSetup};