'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';
import { ConfigLoader } from '../lib/config-loader';

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
            hostname: this.config.get('api-helper').hostName,
            port: this.config.get('api-helper').port,
            path: opts.uri || '',
            method: opts.method || '',
            headers: opts.headers || {}
        };
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

        return new Promise((resolve: Function, reject: Function) => {
            let request: any = http.request(reqOpts, (res: any) => {
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
