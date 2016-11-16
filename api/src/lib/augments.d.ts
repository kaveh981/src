// Declaration merging goes here.
import * as Knex from 'knex';
import { UserModel } from '../models/user/user-model';

declare module './database-manager' {
    // Promise that the dbm will extend knex
    interface DatabaseManager extends Knex {}
}

declare module 'express' {

    // Augment the express request object
    interface Request {

        /** Information about the user. This should only be populated if the request comes from a real IXM Buyer. */
        ixmUserInfo: UserModel;

        /** Request ID */
        id: string;

    }

    // Augment the express response object.
    interface Response {

        /** Response Id matching request */
        id: string;

        /**
         * Send an error message in the correct format.
         * @param error - The error code string in ./config/errors.json corresponding to the message.
         * @param details - The details of the error message, optional.
         */
        sendError(error: string, details?: string[]): void;

        /**
         * Send JSON payload with 200 status code.
         * @param payload - JSON object to send in the response.
         * @param pagination - The pagination parameters, optional.
         */
        sendPayload(payload: any, url?: string, pagination?: any): void;

        /**
         * Send a message as JSON 
         * @param status - The status code to send with the message.
         * @param json - The json object to send. 
         */
        sendJSON(status: number, json: any): void;
    }
}
