
'use strict';

import * as Promise from 'bluebird';
import * as http from 'http';

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
            hostname: opts.hostname || '',
            port: opts.port || '',
            path: opts.uri || '',
            method: opts.method || '',
            headers: opts.headers || {}
        };
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
