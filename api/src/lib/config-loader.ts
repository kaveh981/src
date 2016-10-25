'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as Promise from 'bluebird';

require('dotenv').config();

/** Simple configuration loader, reads from the config folder at ./config. */
class ConfigLoader {

    /** Config Folder */
    public configFolder: string;

    /** Configuration storage */
    private configMap: any = {};

    /**
     * Construct a new config loader which loads from the given folder.
     * @param folder - The folder containing config, located relative to the config module folder.
     */
    constructor(folder: string = '../config/') {
        this.configFolder = path.join(__dirname, folder);
    }

    /**
     * Retrieve an environment variable
     * @param variable - The name of the environment variable to get.
     * @returns The value of the environment variable requested. Throws error if it is not configured.
     */
    public getVar(variable: string, optional?: boolean): string {
        let value: string = process.env[variable];

        if (!value && !optional) {
            throw new Error(`Environment variable "${variable}" has not been configured.`);
        }

        return value;
    }

    /**
     * Get config by name.
     * @param config - The name of the configuration file to load from, without file extension.
     * @returns A JSON object containing the configuration information.
     */
    public get(config: string): any {
        if (!this.configMap[config]) {
            this.loadConfig(config + '.yaml');
        }

        return this.configMap[config];
    }

    /**
     * Load the configuration from this.configFolder/filename, and store it in the configMap.
     * @param filename - The name of the file to load from the file system.
     */
    private loadConfig(filename: string): void {
        let filepath = path.join(this.configFolder, filename);
        let fileContent = fs.readFileSync(filepath).toString();
        let configContent = yaml.safeLoad(fileContent);

        this.configMap[filename.split('.yaml')[0]] = configContent;
    }

}

export { ConfigLoader };
