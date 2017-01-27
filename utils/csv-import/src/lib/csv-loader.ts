'use strict';

import csv = require('csv-parse/lib/sync');

import { Loader } from './loader';

/** CsvLoader class - Loads and parses a string of comma-separated-values (CSV) */
class CSVLoader extends Loader {

    /**
     * Constructs an instance of CsvLoader
     * Assigns folder property to the path specified by CSV_DIR environment variable
     * Depends on: ConfigLoader
     * @param configLoader - the configLoader singleton instance to use as dependency
     */
    constructor() {
        super('CSVL');
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
     * Gets sections from a csv file, contained in the CSV_DIR path
     * @param name - the name of the csv file without the .csv extension
     * @returns {ISection[]}
     */
    public getSections(name: string): ISection[] {

        if (!this.loadedMap[name]) {
            this.loadedMap[name] = this.parseSections(this.loadCsvFile(name));
        }

        return this.loadedMap[name];

    }

    /**
     * Returns JSON Array from parsed csv file
     * @param name - the file name without the .csv file extension
     */
    public loadCsvFile(name: string) {

        try {
            return this.parseCsv(super.loadFile(name));
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
     * @returns {IProposal[]} - An array of proposal objects, sanitised into a valid proposal
     */
    private parseProposals(parsedCsv: IProposal[]): IProposal[] {

        return parsedCsv.map((proposal: any) => {
            // ownerContactID defaults to ownerID
            proposal.ownerContactID = (typeof proposal.ownerContactID === "undefined" || proposal.ownerContactID === "") ? proposal.ownerID : proposal.ownerContactID

            proposal.sectionIDs = proposal.sectionIDs && proposal.sectionIDs.toString().split(',').map(Number);
            // Translate falsy values to [], but have 0 translate to ["0"]
            proposal.targetedUsers = (proposal.targetedUsers || proposal.targetedUsers === 0) ? proposal.targetedUsers.toString().split(',').map(Number) : [];
            proposal.createDate = null;
            proposal.modifyDate = null;

            return proposal;
        });

    }

    /**
     * Sanitises an array of section-like objects to conform with the ISection Interface
     * @param parsedCsv - an array of section-like objects parsed from a csv file
     * @returns {ISection[]} - An array of section objects, sanitised into a valid ISection[] type
     */
    private parseSections(parsedCsv: ISection[]): ISection[] {
        return parsedCsv.map((section: any) => {

            section.matches = [];

            if (section.fullMatchesURL) {
                section.fullMatchesURL.toString().split(',').forEach((matchURL) => {
                    section.matches.push({ matchType: 1, url: matchURL });
                });
            }
            delete section.fullMatchesURL;

            if (section.partialMatchesURL) {
                section.partialMatchesURL.toString().split(',').forEach((matchURL) => {
                    section.matches.push({ matchType: 2, url: matchURL });
                });
            }
            delete section.partialMatchesURL;

            if (section.matches.length < 1) {
                delete section.matches;
            }

            // Replace siteIDs with siteID because in Searhaack siteID array in request body is named 'siteID'
            section.siteID = section.siteIDs && section.siteIDs.toString().split(',').map(Number);
            delete section.siteIDs;

            section.frequencyRestrictions = (section.frequencyRestrictions || section.frequencyRestrictions === 0) ?
                                             section.frequencyRestrictions.toString().split(',').map(Number) : [];

            section.audienceRestrictions = (section.audienceRestrictions || section.audienceRestrictions === 0) ?
                                            section.audienceRestrictions.toString().split(',').map(Number) : [];

            section.adUnitRestrictions = (section.adUnitRestrictions || section.adUnitRestrictions === 0) ?
                                          section.adUnitRestrictions.toString().split(',').map(Number) : [];

            section.countryRestrictions = section.countryRestrictions ?
                                          section.countryRestrictions.toString().split(',') : [];

            return section;

        });
    }

}

export { CSVLoader };
