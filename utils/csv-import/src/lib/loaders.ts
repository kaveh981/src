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

    /** Logger instance specific to each loader instance */
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
     * Load the configuration from config/filename, and store it in the configMap.
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

    /** 
     * Constructs an instance of CsvLoader
     * Assigns folder property to the path specified by CSV_DIR environment variable
     * Depends on: ConfigLoader
     * @param configLoader - the configLoader singleton instance to use as dependency
     */
    constructor(configLoader: ConfigLoader) {
        let folder = configLoader.getEnvironmentVariable('CSV_DIR');
        super(folder, 'CSVL');
    }

    /**
     * Gets proposals from a file, contained in the CSV_DIR path
     * @param name - the name of the csv file without the .csv extension
     * @returns {IProposal[]}
     */
    public getProposals(name: string): IProposal[] {

        if (!this.map[name]) {
            let parsedCsv = this.getCsv(name);
            this.map[name] = this.parseProposals(parsedCsv);
        }

        return this.map[name];
    }

    /**
     * Gets an object of parsed csv file
     * @param name - the name of the csv file without the file extension
     * @returns {any}
     */
    public getCsv(name: string) {

        if (!this.map[name]) {
            this.loadCsvFile(name);
        }

        return this.map[name];
    }

    /**
     * Parses an input string in csv format into an object
     * @param input - csv string in which the first row defines the column names
     * @returns {any}
     */
    private parseCsv(input: string) {
        let csvParserOptions = {
            columns: true,
            auto_parse: true
        };

        return csv(input, csvParserOptions);
    }

    /**
     * Loads csv file and puts it to has-map of loaded csv files
     * @param name - the file name without the .csv file extension
     */
    private loadCsvFile(name: string) {
        try {
            this.map[name] = this.parseCsv(super.loadFile(name + '.csv'));
        } catch (e) {
            this.logger.error(e);
        }
    }

    /**
     * Sanitises an array of proposal-like objects to conform with the IProposal Interface
     * @param parsedCsv - an array of proposal-like objects parsed from a csv file
     * @returns {IProposal[]}
     */
    private parseProposals(parsedCsv: IProposal[]): IProposal[] {
        return parsedCsv.map((proposal: any) => {
            if (typeof proposal.sectionIDs === 'string') {
                proposal.sectionIDs = proposal.sectionIDs.replace(' ', '');
            }
            proposal.sectionIDs = proposal.sectionIDs.toString().split(',');
            proposal.sectionIDs = proposal.sectionIDs.map(Number);
            proposal.createDate = null;
            proposal.modifyDate = null;

            return proposal;
        });
    }

}

export { ConfigLoader, CsvLoader };
