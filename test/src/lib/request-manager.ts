'use strict';

/** node_modules */
import * as request from 'request';
import * as Promise from 'bluebird';

/** Lib */
import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log = new Logger('RQMN');

class APIRequestManager {

    private baseDomain: string;
    private configLoader: ConfigLoader;

    /**
     * Constructor
     * configLoader - An instance of the ConfigLoader.
     */
    constructor(configLoader: ConfigLoader) {
        this.configLoader = configLoader;
        this.baseDomain = configLoader.getVar('API_BASE');
        if (this.baseDomain.indexOf('https://') === 0) { process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; }
    };

    /**
     * Send a get request to the path with given params and userID.
     * @param path - The path to send to, relative to the base domain.
     * @param params - The query string parameters.
     * @param userID - The userID of the IXM Buyer you are impersonating.
     */
    public get(path: string, params: any, userID: number): Promise<any> {
        return new Promise((resolve, reject) => {

            let options = {
                baseUrl: this.baseDomain,
                qs: params,
                uri: path,
                method: 'GET',
                json: true,
                headers: {
                    [this.configLoader.get('api-config')['authentication-header']]: userID
                }
            };

            Log.debug('Sending GET request to ' + path);
            Log.trace('Options: ' + JSON.stringify(options));

            request(options, (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }
                Log.trace(JSON.stringify(body));
                resolve({ status: response.statusCode, body: body });
            });

        });
    }

    /**
     * Send a put request to the path with given body and userID.
     * @param path - The path to send to, relative to the base domain.
     * @param body - The JSON body.
     * @param userID - The userID of the IXM Buyer you are impersonating.
     */
    public put(path: string, body: any, userID: number): Promise<any> {
        return new Promise((resolve, reject) => {

            let options = {
                baseUrl: this.baseDomain,
                body: body,
                uri: path,
                method: 'PUT',
                json: true,
                headers: {
                    [this.configLoader.get('api-config')['authentication-header']]: userID
                }
            };

            Log.debug('Sending PUT request to ' + path);
            Log.trace('Options: ' + JSON.stringify(options));

            request(options, (error, response, resBody) => {
                if (error) {
                    reject(error);
                    return;
                }
                Log.trace(JSON.stringify(resBody));
                resolve({ status: response.statusCode, body: resBody });
            });

        });
    }

}

export { APIRequestManager }
