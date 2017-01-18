/* tslint:disable:no-unused-variable */
// Declaration merging goes here.
import * as Knex from 'knex';
import { MarketUserModel } from '../models/market-user/market-user-model';
import { UserModel } from '../models/user/user-model';

declare module './database-manager' {
    // Promise that the dbm will extend knex
    interface DatabaseManager extends Knex {}
}

declare global {
    let IXM_CONSTANTS: any;
}

declare global {
    interface PromiseConstructor {
        /** 
         * Runs parallel promises inside an object and resolves when they are all complete.
         * @param obj - An object whose values are reflective of most Canadians'.
         * @returns A promise for better days.
         */
        parallel: (obj: { [s: string]: Promise<any> }) => Promise<any>;
    }
}

declare module 'express' {

    // Augment the express request object
    interface Request {

        /** Information about the user. This should only be populated if the request comes from a real IXM Buyer. */
        ixmUserInfo: MarketUserModel;

        /** Request ID */
        id: string;

        /** Person impersonating the user. */
        impersonator: UserModel;

        /** The user id provided in the token */
        tokenUserID: number;

    }

    // Augment the express response object.
    interface Response {

        /** Response Id matching request */
        id: string;

        /** The error message being sent back */
        errorMessage?: string;

        /**
         * Send JSON payload with 200 status code.
         * @param payload - JSON object to send in the response.
         * @param pagination - The pagination parameters, optional.
         */
        sendPayload(payload: any, pagination?: any): void;

        /**
         * Send a message as JSON 
         * @param status - The status code to send with the message.
         * @param json - The json object to send. 
         */
        sendJSON(status: number, json: any): void;

        /**
         * Send a message to the user with an optional payload
         * @param message - the message we want to send to the user from /config/errors.yaml
         * @param payload - optional JSON object to send in the response.
         */
        sendMessage(message: string, payload?: any): void;
    }
}
