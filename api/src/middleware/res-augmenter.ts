// Reponse augmenter
import * as express from 'express';

import { Validator } from '../lib/validator';

// Augment the express response interface
declare module 'express' {
    interface Response {

        // Variables
        ixmBuyerInfo: {
            userId: string
        };

        // Functions
        sendError(status: number, error: string, message?: string): void;
        sendValidationError(details: string[]): void;
        sendPayload(payload: any): void;
        sendNotFoundError(): void;
        sendUnauthorizedError(): void;
        sendNoContent(): void;
        sendInternalAuthError(): void;
    }
}

// The standardized response object
interface IHttpResponse {
    'status': number;
    'message': string;
    'data': any;
}

// Add the extra functions to the response object
function augmentResponse(res: express.Response): void {

    // Send an error message.
    res.sendError = (status: number, error: string) => {
        let msg: IHttpResponse = {
            'status': status,
            'message': error,
            'data': {}
        };

        res.status(status).send(JSON.stringify(msg));
    };

    // Validation error.
    res.sendValidationError = (details: string[]) => {
        let msg: IHttpResponse = {
            'status': 400,
            'message': 'VALIDATION_ERROR',
            'data': {
                'errors': JSON.stringify(details)
            }
        };

        res.status(400).send(JSON.stringify(msg));
    };

    // 404 error handler
    res.sendNotFoundError = () => {
        res.sendError(404, 'NOT_FOUND');
    };

    // 403 error hanlder
    res.sendUnauthorizedError = () => {
        res.sendError(403, 'UNAUTHORIZED');
    };

    // 500 error
    res.sendInternalAuthError = () => {
        res.sendError(500, "INTERNAL_AUTHENTICATION_ERROR");
    };

    // 204 no content
    res.sendNoContent = () => {
        let msg: IHttpResponse = {
            'status': 204,
            'message': 'NO_CONTENT',
            'data': {}
        };

        res.status(204).send(JSON.stringify(msg));
    };

    // Send JSON payload
    res.sendPayload = (payload: any) => {

        if (!payload || Object.keys(payload).length === 0) {
            res.sendNoContent();
            return;
        }

        let msg: IHttpResponse = {
            'status': 200,
            'message': 'OK',
            'data': {}
        };

        Object.assign(msg.data, payload);

        res.status(200).send(JSON.stringify(msg));
    };

};

// The augmentation middleware
function ResponseAugmenter(req: express.Request, res: express.Response, next: Function): void {
    augmentResponse(res);
    next();
}

module.exports = () => { return ResponseAugmenter; };
