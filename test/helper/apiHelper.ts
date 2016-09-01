import * as promise from 'bluebird';
import * as http from 'request'

export class apiHelper {

    private queryString:boolean = false;
    private options:any = {};

    public setOptions(opts:any) {
        if (opts.method === 'GET' || opts.method === 'DELETE_QS') {
            this.queryString = true;
            if (opts.method === 'DELETE_QS') opts.method = 'DELETE';
        } else {
            this.queryString = false;
        }

        this.options = {
            uri: opts.uri || '',
            method: opts.method || '',
            headers: opts.headers || {}
        };
    }

    public sendRequest(body:any) {
        let reqOpts = this.options;
        if (this.queryString) {
            reqOpts.path += '?';
            for (let param in body) {
                if (body.hasOwnProperty(param)) {
                    reqOpts.path += (param + '=' + body[param] + '&');
                }
            }
            if (reqOpts.path.charAt(reqOpts.path.length - 1) === '&')
                reqOpts.path = reqOpts.path.slice(0, -1);
        } else {
            reqOpts.json = body;
        }


        let PromiseRequest = promise.method((reqOpts)=> {
            return new Promise((resolve, reject) => {
                let request = http(reqOpts, function (error, response, body) {

                    if (error) {
                        console.log('Problem with request:', error);
                        reject(error);
                    }
                    else if (response.statusCode === 400) {
                        let result = {
                            'error': response.body.error,
                            'httpVersion': response.httpVersion,
                            'httpStatusCode': response.statusCode,
                            'headers': response.headers,
                            'trailers': response.trailers
                        };
                        resolve(result);

                    }
                    else {
                        let result = {
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
        });
        return PromiseRequest(reqOpts).then((value) => {
            return value
        });
    }

}
