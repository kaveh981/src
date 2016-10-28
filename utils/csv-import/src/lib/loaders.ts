'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import csv = require('csv-parse/lib/sync');

import { Logger } from './logger';

/** Abstract Loader class, inherited by all other loaders */
class Loader {

    /** Path to load from */
    private folder: string;

    /** Hash-map of already loaded files */
    protected map: {} = {};

    protected logger: Logger;

    constructor(folder: string, name: string) {
        this.folder = path.resolve(__dirname, folder);
        this.logger = new Logger(name);
    }

    protected loadFile(name: string) {
        let filePath = path.join(this.folder, name);
        return fs.readFileSync(filePath).toString();
    }

}

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
        if (!this.map[config]) {
            this.loadConfig(config + '.yaml');
        }

        return this.map[config];
    }

    /**
     * Load the configuration from this.configFolder/filename, and store it in the configMap.
     * @param filename - The name of the file to load from the file system.
     */
    private loadConfig(filename: string): void {
        let fileContents;
        try {
            fileContents = super.loadFile(filename);
        } catch (e) {
            this.logger.error(e);
        }

        this.map[filename.split('.yaml')[0]] = yaml.safeLoad(fileContents);
    }

}

/** CsvLoader class - Loads  */
class CsvLoader extends Loader {

    /** Constructs an instance of CsvLoader
     *  Depends on: ConfigLoader
     *  @param configLoader - the configLoader singleton instance to use as dependency
     */
    constructor(configLoader: ConfigLoader) {
        let folder = configLoader.getEnvironmentVariable('CSV_DIR');
        super(folder, 'CSVL');
    }

    public getProposals(name: string) {

        if (!this.map[name]) {
            let parsedCsv = this.getCsv(name);
            this.map[name] = this.parseProposals(parsedCsv);
        }

        return this.map[name];
    }

    public getCsv(name: string) {

        if (!this.map[name]) {
            this.loadCsvFile(name);
        }

        return this.map[name];
    }

    private parseCsv(input: string) {
        let csvParserOptions = {
            columns: true,
            auto_parse: true
        };

        return csv(input, csvParserOptions);
    }

    private loadCsvFile(name: string) {
        try {
            this.map[name] = this.parseCsv(super.loadFile(name + '.csv'));
        } catch (e) {
            this.logger.error(e);
        }
    }

    private parseProposals(parsedCsv: IProposal[]): IProposal[] {
        let proposals = parsedCsv.map((proposal: any) => {
            console.log(typeof proposal.sectionIDs);
            if (typeof proposal.sectionIDs === 'string') {
                proposal.sectionIDs = proposal.sectionIDs.replace(' ', '');
            }
            proposal.sectionIDs = proposal.sectionIDs.toString().split(',');
            proposal.sectionIDs = proposal.sectionIDs.map(Number);
            proposal.createDate = null;
            proposal.modifyDate = null;

            return proposal;
        });

        return proposals;
    }

}

export { ConfigLoader, CsvLoader };
