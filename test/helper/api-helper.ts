'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';
import * as https from 'https';

import { ConfigLoader } from '../lib/config-loader';
import { IApiHelper } from "./interfaces/IapiHelper";

class ApiHelper implements IApiHelper {

    public reqOptions: IReqOptions = {};
    public config: ConfigLoader;
    public _queryString: Boolean = true;
    public _protocol: string;

    constructor(config: ConfigLoader) {
        this.config = config;
        this._protocol = this.config.get('api-helper').protocol;
        if (this._protocol === 'https') {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }
    }

     set reqOpts(options: IReqOptions) {
        this.reqOptions.headers = options.headers || this.reqOptions.headers || {};
        this.reqOptions.hostname = options.hostname || this.reqOptions.hostname || this.config.get('api-helper').hostname;
        this.reqOptions.method = options.method || this.reqOptions.method || '';
        this.reqOptions.port = options.port || this.reqOptions.port || this.config.get('api-helper').port;
        this.reqOptions.path =  options.path || this.reqOptions.path || '';
        this.reqOptions.json = options.json || this.reqOptions.json || {};
    }

    get reqOpts(){
        return this.reqOptions;
    }

    set queryString(qs: Boolean){
        this._queryString = qs;
    }

    get queryString(){
        return this._queryString;
    }

    set protocol(protocol: string){
        this._protocol = protocol;
    }

    get protocol(){
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
        if (requestBody && this._queryString ) {

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
            request.end();
        });
    }

}
export  { ApiHelper }
