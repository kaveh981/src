'use strict';

import csv = require('csv-parse/lib/sync');

import { Loader } from './loader';
import { ConfigLoader } from './config-loader';

/** CsvLoader class - Loads and parses a string of comma-separated-values (CSV) */
class CSVLoader extends Loader {

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
     * Gets proposals from a csv file, contained in the CSV_DIR path
     * @param name - the name of the csv file without the .csv extension
     * @returns {IProposal[]}
     */
    public getProposals(name: string): IProposal[] {

        if (!this.loadedMap[name]) {
            this.loadedMap[name] = this.parseProposals(this.loadCsvFile(name));
        }

        return this.loadedMap[name];
    }

    /**
     * Returns JSON Array from parsed csv file
     * @param name - the file name without the .csv file extension
     */
    public loadCsvFile(name: string) {

        try {
            return this.parseCsv(super.loadFile(name + '.csv'));
        } catch (e) {
            this.logger.error(e);
            return [];
        }

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
     * Sanitises an array of proposal-like objects to conform with the IProposal Interface
     * @param parsedCsv - an array of proposal-like objects parsed from a csv file
     * @returns {IProposal[]} - An array of proposal objects, sanitised into a valid IProposal[] type
     */
    private parseProposals(parsedCsv: IProposal[]): IProposal[] {

        return parsedCsv.map((proposal: any) => {
            proposal.sectionIDs = proposal.sectionIDs.toString().split(',');
            proposal.sectionIDs = proposal.sectionIDs.map(Number);
            proposal.createDate = null;
            proposal.modifyDate = null;

            return proposal;
        });
    }

}

export { CSVLoader };
