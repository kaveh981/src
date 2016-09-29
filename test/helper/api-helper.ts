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
    private buyerIDHeaderName: string;
    private userID: number;
    private queryString: boolean = false;
    private nodeOptions: any = {};
    /**
     * Constructs an API helper.
     * @param config {ConfigLoader} - The config loader to use. Should point to test config folder
     */
    constructor(config: ConfigLoader) {
        this.config = config;
        this.protocol = this.config.get('api-helper').protocol;
        this.hostname = this.config.get('api-helper').hostname;
        this.port = this.config.get('api-helper').port;
        this.buyerIDHeaderName = this.config.get('auth').header;
    }

    /**
     * Pass in valid options permitted by the node http/https modules.
     * @param opts {any} - The provided options in the form of an object containing key-value pairs
     */
    set options(opts: any){
        if (opts.method === 'GET' || opts.method === 'DELETE_QS') {
            this.queryString = true;
            if (opts.method === 'DELETE_QS') {
                opts.method = 'DELETE';
            }
        } else {
            this.queryString = false;
        }

        opts.path = opts.uri || '';
        delete opts.uri;

        opts.hostname = opts.hostname || this.hostname;
        opts.port = opts.port || this.port;
        opts.method = opts.method || '';
        opts.headers = opts.headers || {};
        this.nodeOptions = JSON.parse(JSON.stringify(opts));
    }

    /**
     * Add the buyer's userID to the request
     * @param _userID {number} - userID of the target buyer
     */
    set buyerID(_userID: any) {
        this.userID = _userID;
    }

    /**
     * Clear the header and set it with the new value
     * @param header {} - request header
     */
    set header(header: {}) {
        this.userID = undefined;
        this.nodeOptions.header = header;
    }
    /**
     * Using the provided request body, send request
     * @param [requestBody] {any} - request body in object form
     * @returns A promise that resolves with an object containing the response
     */
    public sendRequest(requestBody?: any): Promise<any> {
        // Start with a copy of the initially configured node options
        let reqOpts: any = JSON.parse(JSON.stringify(this.nodeOptions));

        // Combine buyer's userID with options (if userID present)
        if (typeof this.userID !== 'undefined') {
            if (typeof reqOpts.headers === 'undefined') {
                reqOpts.headers = {};
            }
            reqOpts.headers[this.buyerIDHeaderName] = this.userID;
        }

        // Process query string or attach request body
        if (this.queryString) {
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
            console.log(JSON.stringify(reqOpts));
            let request: any = requestCall(reqOpts, (res: any) => {

                let body: string = '';
                res.on('data', (chunk) => {
                    body += chunk.toString();
                });

                res.on('error', (error) => {
                    reject(error);
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
