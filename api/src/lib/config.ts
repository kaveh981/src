'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';

require('dotenv').config();

/**
 * Simple configuration loader, reads from the config folder at ./config.
 */
class Config {

    /**
     * Configuration storage
     */
    private static configMap: any = {};

    /**
     * Retrieve an environment variable
     * @param variable - The name of the environment variable to get.
     * @returns The value of the environment variable requested. Throws error if it is not configured.
     */
    public static getVar(variable: string): string {
        let value: string = process.env[variable];

        if (!value) {
            throw `Environment variable "${variable}" has not been configured.`;
        }

        return value;
    }

    /**
     * Get config by name.
     * @param config - The name of the configuration file to load from, without file extension.
     * @returns A JSON object containing the configuration information.
     */
    public static get(config: string): any {
        if (!this.configMap[config]) {
            this.loadConfig(config + '.json');
        }

        return this.configMap[config];
    }

    /**
     * Load the configuration from ./config/filename, and store it in the configMap.
     * @param filename - The name of the file to load from the file system.
     */
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
