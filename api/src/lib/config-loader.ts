'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';

require('dotenv').config({});

// Simple configuration loader, reads from the config folder.
class ConfigLoader {

    // Async versions of methods need to be declared
    public static loadConfigAsync: (filename: string) => Promise<any>;

    // Load the configuration from ./config/filename, returns content as JSON object.
    public static loadConfig(filename: string): any {

        let configContent: any;
        let fileContent: string;
        let filepath: string = path.join(__dirname, `../config/${filename}`);

        try {
            fileContent = fs.readFileSync(filepath).toString();
            configContent = JSON.parse(fileContent);
        } catch (e) {
            throw e;
        }

        return configContent;
    }

    // Retrieve an environment variable
    public static getEnv(variable: string): string {

        let value: string = process.env[variable];

        if (value) {
            return value;
        } else {
            throw `Environment variable "${variable}" has not been configured.`;
        }

    }

}

// Promisify class methods.
ConfigLoader.loadConfigAsync = Promise.promisify(ConfigLoader.loadConfig);

export { ConfigLoader };
