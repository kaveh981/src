'use strict';

import * as request from 'request-promise-native';

import { Logger } from './logger';
import { ConfigLoader } from './config-loader';

const Log = new Logger('SECP');

/**
 * Section Populator Class
 */
class SectionPopulator {

    private configLoader: ConfigLoader;
    private accessToken: string;

    constructor(configLoader: ConfigLoader) {
        this.configLoader = configLoader;
    }

    /**
     * Import array of validated section objects into database
     * @param {ISection[]} sections parsed section object array to create
     * @param {ISection[]} originalSections unparsed section object array to generate output
     * @return object contains import results
     */
    public async importSections (sections: ISection[], originalSections: ISection[]): Promise<ISectionResult[]> {

        let results: ISectionResult[] = [];

        for (let i = 0; i < sections.length; i += 1 ) {
            let response = await this.putSection(sections[i]).catch((err) => {

                if (err.name === 'StatusCodeError') {
                    // For 400, 500, 403 errors, the responses include 'error' filed; For other errors, responses include 'message' field
                    results.push(Object.assign(originalSections[i], {
                        responseCode: err.error.responseCode,
                        responseErrors: err.error.error || err.error.message,
                        newSectionID: null
                    }));
                } else {
                    results.push(Object.assign(originalSections[i], {
                        responseCode: err.name,
                        responseErrors: err.message,
                        newSectionID: null
                    }));
                }

               Log.error('Fail to insert section\n' + JSON.stringify({ section: sections[i], reason: err }, undefined, 4));
            });

            if (response) {
                results.push(Object.assign(originalSections[i], {
                    responseCode: response.responseCode,
                    responseErrors: null,
                    newSectionID: response.data.sectionID[0]
                }));

                Log.info(`New section with ID ${response.data.sectionID[0]} is created.`);
            }

            await this.sleep(500);
        }

        return results;

    }

    /**
     * Get access token by username and password
     * @param {string} username username 
     * @param {string} password password
     */
    public async getAccessToken (username: string, password: string) {
        let options = {
            method: 'POST',
            url: `${this.configLoader.getEnvironmentVariable('INDEX_AUTH')}auth/oauth/token`,
            body: {
                username: username,
                password: password
            },
            json: true,
            rejectUnauthorized: false
        };

        let response = await request(options);

        this.accessToken = response.data.accessToken;
    }

    /**
     * Create section by Searhaack API
     * @param {*} payload section object to create
     * @returns {Promise<any>} response from Searhaack API
     */
    public async putSection (payload: any): Promise<any> {
        let options = {
            method: 'PUT',
            url: `${this.configLoader.getEnvironmentVariable('INDEX_API')}api/publishers/sections`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`
            },
            body: payload,
            json: true,
            rejectUnauthorized: false
        };

        let response = await request(options);
        return response;
    }

    /**
     * Sleep 
     * @param {number} [ms=0] sleep time in milliseconds
     */
    private sleep(ms = 0) {
        return new Promise(r => setTimeout(r, ms));
    }
}

export { SectionPopulator }
