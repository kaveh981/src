'use strict';

import * as Promise from 'bluebird';
import * as http from 'request';
import * as https from 'https';

/**
 * Interface for agent options with request.js requests
 */
interface IAgentOptions {
    host: string,
    port: string,
    path: string,
    /**
     * This parameter, when set to false, allows us to send requests to
     * the API without sending a proper key and certificate in the request
     */
    rejectUnauthorized: boolean
}

class ApiHelper {

    private queryString: boolean = false;
    private options: any = {};

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
     * Initialize the agent options, which allows us to perform insecure API calls for testing.
     * @param options {IAgentOptions} - Set of options for the agent being passed in the request
     * @returns Nothing.
     */
    public setAgentOptions(options: IAgentOptions): void {
        this.options.agent = new https.Agent(options);
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
