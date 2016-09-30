'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';
import * as https from 'https';
import { ConfigLoader } from '../lib/config-loader';
import {IApiHelper, IReqOptions} from "./interfaces/IapiHelper";

class ApiHelper implements IApiHelper {


    reqOptions:IReqOptions = {};
    config: ConfigLoader;

    constructor(config: ConfigLoader) {
        this.config = config;
    }

     set reqOpts(options:IReqOptions) {
        this.reqOptions.headers = options.headers || {};
        this.reqOptions.hostname = options.hostname || this.config.get('api-helper').hostname;;
        this.reqOptions.method = options.method || '';
        this.reqOptions.port = options.port;
        this.reqOptions.path = options.path || '';
        this.reqOptions.queryString = options.queryString || true;
        this.reqOptions.protocol = options.protocol || this.config.get('api-helper').protocol;;
        this.reqOptions.jsonBody = options.jsonBody || {};
    }

    /**
     * Using the provided request body, send request
     * @param [requestBody] {any} - request body in object form
     * @returns A promise that resolves with an object containing the response
     */
    public sendRequest(requestBody?:any):Promise<any> {
        // Start with a copy of the initially configured node options
        let reqOpts:IReqOptions = this.reqOptions;

        // Process query string or attach request body
        if (this.reqOptions.queryString) {
            let qs:string = '?';
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
            this.reqOptions.jsonBody = requestBody;
        }

        /**
         * With a given protocol, must explicitly choose between http and https implementation.
         * http://stackoverflow.com/questions/34147372/node-js-error-protocol-https-not-supported-expected-http
         */
        let requestCall = (this.reqOptions.protocol === 'https') ? https.request : http.request;

        return new Promise((resolve:Function, reject:Function) => {
console.log(JSON.stringify(reqOpts));
            let request:any = requestCall(reqOpts, (res:any) => {

                let body:string = '';
                res.on('data', (chunk) => {
                    body += chunk.toString();
                });

                res.on('error', (error) => {
                    reject(error);
                });

                res.on('end', () => {
                    let result:any = {
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
export  {ApiHelper}