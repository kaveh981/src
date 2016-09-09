/**
 * Config
 *
 * A config loader. Calling Initialize loads all of the config files in `./config` into memory, storing them by filename
 * with `.json` removed.
 *
 */
'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';

require('dotenv').config();

// Simple configuration loader, reads from the config folder.
class Config {

    // Configuration information
    private static configMap: any = {};

    // Retrieve an environment variable
    public static getVar(variable: string): string {
        let value: string = process.env[variable];

        if (!value) {
            throw `Environment variable "${variable}" has not been configured.`;
        }

        return value;
    }

    // Get config by name
    public static get(config: string): any {
        if (!this.configMap[config]) {
            this.loadConfig(config + '.json');
        }

        return this.configMap[config];
    }

    // Load the configuration from ./config/filename, returns content as JSON object.
    private static loadConfig(filename: string): void {
        let filepath: string = path.join(__dirname, `../config/${filename}`);

        let configContent: any;
        let fileContent: string;

        try {
            fileContent = fs.readFileSync(filepath).toString();
            configContent = JSON.parse(fileContent);
        } catch (e) {
            throw e;
        }

        this.configMap[filename.split('.json')[0]] = configContent;
    }

}

export { Config };
