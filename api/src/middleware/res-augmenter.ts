'use strict';

import * as express from 'express';

import { Validator } from '../lib/validator';
import { Config } from '../lib/config';

const errorMessages = Config.get('errors');

/**
 * The standardized response object
 */
interface IHttpResponse {
    /** Status code of the response. */
    status: number;
    /** Message to send in the response about the status code. */
    message: string;
    /** Payload data to send. */
    data: any;
}

/*
 * Adds the extra functions to the response object
 * @param res - The response object to add new functions to.
 */
function augmentResponse(res: express.Response): void {

    // Send JSON payload
    res.sendPayload = (payload: any) => {
        // If the payload is undefined or is an empty object, send no content
        if (!payload || Object.keys(payload).length === 0) {
            res.sendNoContent();
            return;
        }

        let msg: IHttpResponse = {
            'status': 200,
            'message': errorMessages['200'],
            'data': {}
        };

        Object.assign(msg.data, payload);

        res.status(200).send(JSON.stringify(msg));
    };

    // Send an error message.
    res.sendError = (status: number, error: string, details: string[]) => {
        let msg: IHttpResponse = {
            status: status,
            message: errorMessages[error] || errorMessages[status] || '',
            data: {}
        };

        if (details) {
            msg.data = {
                errors: details
            };
        }

        res.status(status).send(JSON.stringify(msg));
    };

    // 204 no content
    res.sendNoContent = () => {
        let msg: IHttpResponse = {
            'status': 204,
            'message': errorMessages['204'],
            'data': {}
        };

        res.status(204).send(JSON.stringify(msg));
    };

    // Validation error.
    res.sendValidationError = (details: string[]) => {
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
