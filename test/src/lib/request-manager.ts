/* tslint:disable:no-unused-variable variable-name */
'use strict';

/** node_modules */
import * as request from 'request';
import * as Promise from 'bluebird';
import * as jwt from 'jsonwebtoken';

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
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    };

    /**
     * Send a get request to the path with given params and userID.
     * @param path - The path to send to, relative to the base domain.
     * @param params - The query string parameters.
     * @param userID - The userID of the IXM Buyer you are impersonating.
     */
    public get(path: string, params: any, user: { userID?: number, userType?: number, accessToken?: string }) {

        let headers: any;

        if (user) {
            headers = {
                [this.configLoader.get('api-config')['user-header']]: user.userID,
                [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
            };
        }

        return this.sendRequest(this.baseDomain, path, 'GET', params, headers);

    }

    /**
     * Send a put request to the path with given body and userID.
     * @param path - The path to send to, relative to the base domain.
     * @param body - The JSON body.
     * @param userID - The userID of the IXM Buyer you are impersonating.
     */
    public put(path: string, body: any, user: { userID?: number, userType?: number, accessToken?: string }) {

        let headers: any;

        if (user) {
            headers = {
                [this.configLoader.get('api-config')['user-header']]: user.userID,
                [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
            };
        }

        return this.sendRequest(this.baseDomain, path, 'PUT', body, headers);

    }

     /**
      * Send a delete request to the path with given params and userID.
      * @param path - The path to send to, relative to the base domain.
      * @param params - The query string parameters.
      * @param userID - The userID of the IXM Buyer you are impersonating.
      */
     public delete(path: string, params: any, user: { userID?: number, userType?: number, accessToken?: string }) {

        let headers: any;

        if (user) {
            headers = {
                [this.configLoader.get('api-config')['user-header']]: user.userID,
                [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
            };
        }

        return this.sendRequest(this.baseDomain, path, 'DELETE', undefined, headers);

    }

    /** 
     * Get an access token from SH Auth.
     * @param username - The email address for the user.
     * @param password - The password for the user.
     * @param key - The api key for the user.
     * @returns The response from SH Auth.
     */
    public getAuthToken(username: string, password: string, apiKey?: string) {
        return this.sendRequest(this.configLoader.get('api-config')['auth-domain'],
                'auth/oauth/token', 'POST', { username: username, password: password, key: apiKey });
    }

    /**
     * Send request function, to clean up the code.
     * @param domain - The domain to send the request to.
     * @param uri - The URI to send the request to, relative to domain.
     * @param verb - The verb to use.
     * @param body - The body (or query if GET) to send.
     * @param headers - The headers to send.
     * @returns The response from the server.
     */
    public sendRequest(domain: string, uri: string, verb: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS', body?: any, headers?: any) {
        return new Promise((resolve: ({ status: number, body: any }) => any, reject) => {

            let options = {
                baseUrl: domain,
                [ verb === 'GET' ? 'qs' : 'body']: body,
                uri: uri,
                method: verb,
                headers: headers,
                json: true
            };

            Log.debug(`Sending ${verb} request to ` + uri);
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

    public getBaseURL () {
        return this.baseDomain;
    }

    public createAccessToken(user: INewUserData) {
         return jwt.sign({ userID: user.userID, userType: user.userType }, this.configLoader.getVar('AUTH_JWT_PASSWORD'),
                    { algorithm: "HS256" });
    }

}

export { APIRequestManager }
