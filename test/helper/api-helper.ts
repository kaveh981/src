'use strict';

import * as Promise from 'bluebird';
import * as http from 'request';
import * as https from 'https';

import { ConfigLoader } from '../lib/config-loader';

/**
 * Interface for agent options with request.js requests
 */
/*interface IAgentOptions {
    host: string,
    port: string,
    path: string,
    /!**
     * This parameter, when set to false, allows us to send requests to
     * the API without sending a proper key and certificate in the request
     *!/
    rejectUnauthorized: boolean
}*/

/**
 * In the auth config, we expect a header name defined
 */
interface IAuthConfig {
    header: string
}

class ApiHelper {

    private config: ConfigLoader;
    private queryString: boolean = false;
    private options: any = {};

    /**
     * Constructs an API helper.
     * @param config - The config loader to use. Should point to test config folder
     */
    constructor(config: ConfigLoader) {
        this.config = config;
    }

    public setOptions(opts: any): void {
        if (opts.method === 'GET' || opts.method === 'DELETE_QS') {
            this.queryString = true;
            if (opts.method === 'DELETE_QS') {
                opts.method = 'DELETE';
            }
        } else {
            this.queryString = false;
        }

        this.options = {
            uri: opts.uri || '',
            method: opts.method || '',
            headers: opts.headers || {}
        };
    }

    /**
     * Initialize the agent options, which allows us to perform insecure API calls
     * without resorting to process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'.
     * @param options {IAgentOptions} - Set of options for the agent being passed in the request
     * @returns Nothing
     */
    public setAgentOptions(options): void {
        this.options.agent = new https.Agent(options);
    }

    /**
     * Configure the request header with the buyer's userID
     * @param userID {number} - userID of the target buyer
     * @returns Nothing
     */
    public setBuyerUserID(userID: number): void {
        let authConfig: IAuthConfig = this.config.get('auth');

        if (!authConfig.hasOwnProperty('header') || typeof authConfig['header'] != 'string') {
            throw 'Unable to find header name in auth config';
        }

        if (typeof this.options.headers == 'undefined') {
            this.options.headers = {};
        }
        this.options.headers[authConfig['header']] = userID;
        console.log(JSON.stringify(this.options));
    }

    public sendRequest(requestBody: any): Promise<any> {
        let reqOpts: any = this.options;
        if (this.queryString) {
            reqOpts.path += '?';
            for (let param in requestBody) {
                if (requestBody.hasOwnProperty(param)) {
                    reqOpts.path += (param + '=' + requestBody[param] + '&');
                }
            }
            if (reqOpts.path.charAt(reqOpts.path.length - 1) === '&') {
                reqOpts.path = reqOpts.path.slice(0, -1);
            }
        } else {
            reqOpts.json = requestBody;
        }

        return new Promise((resolve: Function, reject: Function) => {
            let request: any = http(reqOpts, (error: Error, response: any , body: any) => {

                if (error) {
                    console.log('Problem with request:', error);
                    reject(error);
                } else if (response.statusCode === 400) {
                    let result: any = {
                        'error': response.body.error,
                        'httpVersion': response.httpVersion,
                        'httpStatusCode': response.statusCode,
                        'headers': response.headers,
                        'trailers': response.trailers
                    };
                    resolve(result);

                } else {
                    let result: any = {
                        'httpVersion': response.httpVersion,
                        'httpStatusCode': response.statusCode,
                        'headers': response.headers,
                        'body': response.body,
                        'trailers': response.trailers
                    };
                    resolve(result);
                }
            });
        });
    }

}

export { ApiHelper }
