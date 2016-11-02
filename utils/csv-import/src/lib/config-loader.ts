'use strict';

/** node_modules */
import * as yaml from 'js-yaml';

/** Lib */
import { Loader } from './loader';

/** Simple configuration loader, reads from the config folder at ./config. */
class ConfigLoader extends Loader {

    /**
     * Construct a new config loader which loads from the given folder.
     * @param folder - The folder containing config, located relative to the lib module folder.
     */
    constructor(folder: string = '../../config/') {
        require('dotenv').config();
        super(folder, 'CONF');
    }

    /**
     * Retrieve an environment variable
     * @param variable - The name of the environment variable to get.
     * @param optional - True if variable is optional.
     * @returns The value of the environment variable requested. Throws error if it is not configured and isn't optional.
     */
    public getEnvironmentVariable(variable: string, optional: boolean = false): string {
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
        if (!this.loadedMap[config]) {
            this.loadConfig(config);
        }

        return this.loadedMap[config];
    }

    /**
     * Load the configuration from config/filename, and store it in the configMap.
     * @param name - The name of the file to load from the file system.
     */
    private loadConfig(name: string): void {
        let fileContents;
        try {
            fileContents = super.loadFile(name + '.yaml');
        } catch (e) {
            this.logger.error(e);
        }

        this.loadedMap[name] = yaml.safeLoad(fileContents);
    }

}

export { ConfigLoader };
