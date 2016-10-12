'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';
import * as https from 'https';

import { ConfigLoader } from '../lib/config-loader';
import * as testFramework from 'testFramework';

class ApiHelper implements testFramework.IApiHelper {

    public reqOptions: IReqOptions = {};
    public config: ConfigLoader;
    public isQueryString: Boolean = true;
    public _protocol: string;
    public json: {};

    constructor(config: ConfigLoader) {
        this.config = config;
        this._protocol = this.config.get('api-helper').protocol;
        if (this._protocol === 'https') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }
    }

     public setReqOpts(options: IReqOptions) {
        this.reqOptions.headers = options.headers || this.reqOptions.headers || {};
        this.reqOptions.hostname = options.hostname || this.reqOptions.hostname || this.config.get('api-helper').hostname;
        this.reqOptions.method = options.method || this.reqOptions.method || '';
        this.reqOptions.port = options.port || this.reqOptions.port || this.config.get('api-helper').port;
        this.reqOptions.path =  options.path || this.reqOptions.path || '';
    }

    public getReqOpts(): IReqOptions {
        return this.reqOptions;
    }

    public setIsQueryString(qs: Boolean) {
        this.isQueryString = qs;
    }

    public getIsQueryString(): Boolean {
        return this.isQueryString;
    }

    public setProtocol(protocol: string): void {
        this._protocol = protocol;
    }

    public getProtocol(): string {
        return this._protocol;
    }
    /**
     * Using the provided request body, send request
     * @param [requestBody] {any} - request body in object form
     * @returns A promise that resolves with an object containing the response
     */
    public sendRequest(requestBody?: any): Promise<any> {
        // Start with a copy of the initially configured node options
        let reqOpts: IReqOptions = JSON.parse(JSON.stringify(this.reqOptions));

        // Process query string or attach request body
        if (requestBody && this.isQueryString ) {

            let qs: string = '?';

            for (let param in requestBody) {
                if (requestBody.hasOwnProperty(param)) {
                    qs += (param + '=' + requestBody[param] + '&');
                }
            }
            if (qs.charAt(qs.length - 1) === '&') {
                qs = qs.slice(0, -1);
            }
            reqOpts.path += qs;
        } else if (!this.isQueryString) {
            reqOpts.headers['Content-Type'] = "application/json";
        }

        /**
         * With a given protocol, must explicitly choose between http and https implementation.
         * http://stackoverflow.com/questions/34147372/node-js-error-protocol-https-not-supported-expected-http
         */
        let requestCall = (this._protocol === 'https') ? https.request : http.request;

        return new Promise((resolve: Function, reject: Function) => {
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
                        'body': JSON.parse(body)
                    };
                    resolve(result);
                });
            });
            if (requestBody && !this.isQueryString) {
                request.write(JSON.stringify(requestBody));
            }
            request.end();
        });
    }

}
export  { ApiHelper }
