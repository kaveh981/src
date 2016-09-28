'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';
import * as https from 'https';
import { ConfigLoader } from '../lib/config-loader';

class ApiHelper {

    private config: ConfigLoader;
    private protocol: string;
    private hostname: string;
    private port: string;
    private headerName: string;
    private userID: number;
    private queryString: boolean = false;
    private options: any = {};

    /**
     * Constructs an API helper.
     * @param config - The config loader to use. Should point to test config folder
     */
    constructor(config: ConfigLoader) {
        this.config = config;
        this.protocol = this.config.get('api-helper').protocol;
        this.hostname = this.config.get('api-helper').hostname;
        this.port = this.config.get('api-helper').port;
        this.headerName = this.config.get('auth').header;
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
            hostname: this.hostname,
            port: this.port,
            path: opts.uri || '',
            method: opts.method || '',
            headers: opts.headers || {}
        };
    }

    /**
     * Add the buyer's userID to the request
     * @param userID {number} - userID of the target buyer
     * @returns Nothing
     */
    public setBuyerUserID(userID: number): void {
        this.userID = userID;
    }

    public sendRequest(requestBody?: any): Promise<any> {
        // Combine buyer's userID with options (if userID present)
        if (typeof this.userID !== 'undefined') {
            if (typeof this.options.headers === 'undefined') {
                this.options.headers = {};
            }
            this.options.headers[this.headerName] = this.userID;
        }

        // Process query string or attach request body
        let reqOpts: any = this.options;
        if (this.queryString === true) {
            reqOpts.path  += '?';
            for (let param in requestBody) {
                if (requestBody.hasOwnProperty(param)) {
                    reqOpts.path  += (param + '=' + requestBody[param] + '&');
                }
            }
            if (reqOpts.path.charAt(reqOpts.path.length - 1) === '&') {
                reqOpts.path  = reqOpts.path.slice(0, -1);
            }
        } else {
            reqOpts.json = requestBody;
        }

        /**
         * With a given protocol, must explicitly choose between http and https implementation.
         * http://stackoverflow.com/questions/34147372/node-js-error-protocol-https-not-supported-expected-http
         */
        let requestCall = (this.protocol === 'https') ? https.request : http.request;

        return new Promise((resolve: Function, reject: Function) => {
            let request: any = requestCall(reqOpts, (res: any) => {
                if (res.statusCode !== 200) {
                    reject();
                }
                 let body: string = '';
                res.on('data', (chunk) => {
                    body += chunk.toString();
                });

                res.on('end', () => {
                    let result: any = {
                        'httpVersion': res.httpVersion,
                        'httpStatusCode': res.statusCode,
                        'headers': res.headers,
                        'body': JSON.parse(body),
                        'trailers': res.trailers
                    };
                    resolve(result);
                });
            });
            request.end();
        });
    }
}

export { ApiHelper }
