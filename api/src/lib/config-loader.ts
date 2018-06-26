'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
const handlers = require('shortstop-handlers');
const shortstop = require('shortstop');
const finder = require('fs-finder');

require('dotenv').config({ silent: true });

/** Simple configuration loader, reads from the config folder at ./config. */
class ConfigLoader {

    /** Project root */
    public baseFolder: string;

    /** Config Folder */
    public configFolder: string;

    /** Configuration storage */
    private configMap: any = {};

    /** Shortstop resolver */
    private resolver: any;

    /**
     * Construct a new config loader which loads from the given folder.
     * @param baseFolder - The root directory of the project relative to config-loader module.
     * @param configFolder - The folder containing all config files, relative to root.
     */
    constructor(baseFolder: string = '../', configFolder: string = './config') {
        this.baseFolder = path.join(__dirname, baseFolder);
        this.configFolder = path.join(this.baseFolder, configFolder);
    }

    /**
     * Load all of the config into memory.
     * @param shortstopPaths - An object with keys representing shortstop keys and values the path relative to baseFolder.
     */
    public async initialize(shortstopPaths: any = {}) {

        let configFiles = finder.from(this.configFolder).findFiles('<[0-9a-zA-Z/.-_ ]+(\.yaml|\.json)>');

        // Create shortstop
        this.resolver = shortstop.create();
        this.resolver.use('path', handlers.path(this.baseFolder));

        for (let key in shortstopPaths) {
            this.resolver.use(key, handlers.path(path.join(this.baseFolder, shortstopPaths[key])));
        }

        // Load config
        for (let i = 0; i < configFiles.length; i++) {
            let file = configFiles[i];
            let filename = path.basename(file);
            let configName = filename.split('.').shift();

            if (filename.match(/\.example\./)) {
                continue;
            } else if (filename.match(/\.production\./) && process.env.NODE_ENV !== 'production') {
                continue;
            } else if (filename.match(/\.development\./) && process.env.NODE_ENV !== 'development') {
                continue;
            } else if (!filename.match(/\.development\./) && !filename.match(/\.production\./) && this.configMap[configName]) {
                continue;
            }

            this.configMap[configName] = await this.loadConfig(file);
        }

        // Apply overrides
        if (this.configMap['override']) {
            for (let key in this.configMap['override']) {
                if (!this.configMap[key]) {
                    throw new Error(`Unknown override key ${key}.`);
                }

                Object.assign(this.configMap[key], this.configMap['override'][key]);
            }
        }

    }

    /**
     * Retrieve an environment variable
     * @param variable - The name of the environment variable to get.
     * @returns The value of the environment variable requested. Throws error if it is not configured.
     */
    public getEnv(variable: string, optional?: boolean): string {

        let value = process.env[variable];

        if (typeof value === 'undefined' && !optional) {
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
            throw new Error(`Configuration "${config}" has not been loaded.`);
        }

        return this.configMap[config];

    }

    /**
     * Read the configuration and resolve shortstop.
     * @param filepath - The path to the file to load from the file system.
     */
    private async loadConfig(filepath: string) {

        let fileContent = fs.readFileSync(filepath).toString();
        let configContent = yaml.safeLoad(fileContent);

        return await this.resolveShortstop(configContent);

    }

    /** 
     * Resolve the shortstop notation for config. Currently only supports 'path:'
     * @param config - The config object to resolve shortstop.
     * @returns A promise for the kraken config with shortstops resolved.
     */
    private resolveShortstop(config: any): Promise<any> {
        return new Promise((resolve, reject) => {

            this.resolver.resolve(config, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });

        });
    }

}

export { ConfigLoader };
