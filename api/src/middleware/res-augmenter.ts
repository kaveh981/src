'use strict';

import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';
import { Logger } from '../lib/logger';

const config = Injector.request<ConfigLoader>('ConfigLoader');
const Log = new Logger('RESP');
const errorMessages = config.get('errors')['en-US'];


interface IPagination {
    /** The specific page of data returned */
    page: number;
    /** The limit of data returned per page */
    limit: number;
}

/**
 * The standardized response object
 */
interface IHttpResponse {
    /** Status code of the response. */
    status: number;
    /** Message to send in the response about the status code. */
    message: string;
    /** Payload data to send. */
    data: any[];
    /** Optional pagination details to send */
    pagination?: IPagination;
}

/*
 * Adds the extra functions to the response object
 * @param res - The response object to add new functions to.
 */
function augmentResponse(res: express.Response): void {

    // Send JSON and set content type
    res.sendJSON = (statusCode: number, message: any) => {

        if (res.headersSent) {
            Log.warn('Tried to send message twice.');
            Log.trace(JSON.stringify(message));
            return;
        }

        Log.trace(`(${res.id}) Responding with message \n${Log.stringify(message)}`);

        let msg = JSON.stringify(message);

        res.set({
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(msg)
        });

        res.status(statusCode).send(msg);

    };

    // Send JSON payload
    res.sendPayload = (payload: any, pagination?: IPagination) => {

        let msg: IHttpResponse = {
            status: 200,
            message: errorMessages['200'],
            data: []
        };

        // If the payload is undefined or is an empty object, send no content
        if (!payload) {
            msg.message = errorMessages['200_NO_CONTENT'];
        }

        if (Array.isArray(payload)) {
            msg.data = payload;
        } else {
            msg.data = [payload];
        }

        if (pagination) {
            msg.pagination = {
                page: pagination.page,
                limit: pagination.limit
            };
        }

        res.sendJSON(200, msg);

    };

    // Send an error message.
    res.sendError = (error: string, details: string[]) => {

        let status = Number(error.split('_')[0]);

        let msg: IHttpResponse = {
            status: status,
            message: errorMessages[error] || errorMessages[status] || '',
            data: []
        };

        if (details) {
            msg.data = details;
        }

        res.sendJSON(status, msg);

    };
};

/**
 * The augmentation middleware, simply calls augmentResponse on the response object.
 */
function ResponseAugmenter(req: express.Request, res: express.Response, next: Function): void {

    augmentResponse(res);
    next();

}

module.exports = () => { return ResponseAugmenter; };
