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
        return new Promise((resolve: ({ status: number, body: any }) => any , reject) => {

            let options = {
                baseUrl: this.baseDomain,
                qs: params,
                uri: path,
                method: 'GET',
                json: true
            };

            if (user) {
                options['headers'] = {
                    [this.configLoader.get('api-config')['user-header']]: user.userID,
                    [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
                };
            }

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
    public put(path: string, body: any, user: { userID?: number, userType?: number, accessToken?: string }) {
        return new Promise((resolve: ({ status: number, body: any }) => any, reject) => {

            let options = {
                baseUrl: this.baseDomain,
                body: body,
                uri: path,
                method: 'PUT',
                json: true
            };

            if (user) {
                options['headers'] = {
                    [this.configLoader.get('api-config')['user-header']]: user.userID,
                    [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
                };
            }

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

     /**
      * Send a delete request to the path with given params and userID.
      * @param path - The path to send to, relative to the base domain.
      * @param params - The query string parameters.
      * @param userID - The userID of the IXM Buyer you are impersonating.
      */
     public delete(path: string, params: any, user: { userID?: number, userType?: number, accessToken?: string }) {
         return new Promise((resolve: ({ status: number, body: any }) => any, reject) => {

             let options = {
                 baseUrl: this.baseDomain,
                 qs: params,
                 uri: path,
                 method: 'DELETE',
                 json: true
             };

             if (user) {
                options['headers'] = {
                    [this.configLoader.get('api-config')['user-header']]: user.userID,
                    [this.configLoader.get('api-config')['token-header']]: user.accessToken || this.createAccessToken(user)
                };
            }

             Log.debug('Sending DELETE request to ' + path);
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
     * Get an access token from SH Auth.
     */
    public getAuthToken(username: string, password: string) {
        return new Promise((resolve: ({ status: number, body: any }) => any, reject) => {

            let options = {
                baseUrl: this.configLoader.get('api-config')['auth-domain'],
                body: {
                    username: username,
                    password: password
                },
                uri: 'auth/oauth/token',
                method: 'POST',
                json: true
            };

            Log.debug('Sending POST request to auth...');
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
