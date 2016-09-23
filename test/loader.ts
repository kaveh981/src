'use strict';

/** Resolve any dependencies in this file and pass it to the injector for safe keeping. */

import * as Promise from 'bluebird';

/** Lib */
import { Injector } from './lib/injector';
import { ConfigLoader } from './lib/config-loader';

// Logger forces us to load the config before importing anything else.
const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

import { DatabaseManager } from './lib/database-manager';
import { ApiHelper } from "./helper/api-helper";

/** Tests */
import { DataSetup } from './helper/data-setup';

/** Dependency Resolution */

const  dataHelper = new ApiHelper();
Injector.put(ApiHelper, 'ApiHelper');

const databaseManager = new DatabaseManager(config);
Injector.put(databaseManager, 'DatabaseManager');

const dataSetup = new DataSetup(databaseManager);
Injector.put(dataSetup, 'DataSetup');

function boot(): Promise<{}> {
    return databaseManager.initialize()
        .catch((err: Error) => {
            databaseManager.shutdown();
        });
}

export { boot };
