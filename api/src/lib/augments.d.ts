// Declaration merging goes here.
import * as Knex from 'knex';

declare module './database-manager' {
    // Promise that the dbm will extend knex
    interface DatabaseManager extends Knex {}
}

declare module 'express' {

    // Augment the express request object
    interface Request {
        /** Information about the user. This should only be populated if the request comes from a real IXM Buyer. */
        ixmBuyerInfo: {
            /** The user's userId */
            userId: string
        };
    }

    // Augment the express response object.
    interface Response {
        /**
         * Send an error message in the correct format.
         * @param status - The status code.
         * @param error - The error code string in ./config/errors.json corresponding to the message.
         * @param [details=void] - Strings with information about the error.
         */
        sendError(status: number, error: string, details?: string[]): void;

        /**
         * Send JSON payload with 200 status code.
         * @param payload - JSON object to send in the response.
         */
        sendPayload(payload: any): void;

        /**
         * Send a 401 validation error.
         * @param details - The details of the validation error.
         */
        sendValidationError(details: string[]): void;

        /** Send a generic 404 not found.*/
        sendNotFoundError(): void;

        /** Send a generic 401 unauthorized.*/
        sendUnauthorizedError(): void;

        /** Send a 204 NO CONTENT message.*/
        sendNoContent(): void;

        /** Send a generic 500 internal server error. */
        sendInternalError(): void;
    }
}