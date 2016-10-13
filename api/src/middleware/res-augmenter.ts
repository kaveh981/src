'use strict';

import * as express from 'express';

import { ConfigLoader } from '../lib/config-loader';
import { Injector } from '../lib/injector';

const config = Injector.request<ConfigLoader>('ConfigLoader');

const errorMessages = config.get('errors')['en-US'];

interface IPagination {
    /** The limit of the data returned */
    limit: number;
    /** The offset of the data returned */
    offset: number;
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
        let msg = JSON.stringify(message);
        res.set({
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(msg)
        });
        res.status(statusCode).send(msg);
    };

    // Send JSON payload
    res.sendPayload = (payload: any, pagination?: IPagination) => {
        // If the payload is undefined or is an empty object, send no content
        if (!payload) {
            res.sendNoContent();
            return;
        }

        let msg: IHttpResponse = {
            status: 200,
            message: errorMessages['200'],
            data: []
        };

        if (Array.isArray(payload)) {
            msg.data = payload;
        } else {
            msg.data = [payload];
        }

        if (pagination) {
            msg.pagination = {
                limit: pagination.limit,
                offset: pagination.offset
            };
        }

        res.sendJSON(200, msg);
    };

    // Send an error message.
    res.sendError = (status: number, error: string, details: string[]) => {
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

    // 204 no content
    res.sendNoContent = () => {
        let msg: IHttpResponse = {
            status: 200,
            message: errorMessages['200_NO_CONTENT'],
            data: []
        };

        res.sendJSON(200, msg);
    };

    // 400 Validation error.
    res.sendValidationError = (details: any[]) => {
        res.sendError(400, '400', details);
    };

    // 403 error handler
    res.sendUnauthorizedError = () => {
        res.sendError(401, '401');
    };

    // 404 error handler
    res.sendNotFoundError = () => {
        res.sendError(404, '404');
    };

    // 500 general error
    res.sendInternalError = () => {
        res.sendError(500, '500');
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
