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
        sendSchemedPayload(payload: any, schema: string): void;
        sendNotFoundError(resource: string): void;
        sendUnauthorizedError(): void;
        sendInternalAuthError(): void;
    }
}

// Add the extra functions to the response object
function augmentResponse(res: express.Response): void {

    // Send an error message.
    res.sendError = (status: number, error: string, message: string = '') => {
        let msg = {
            'status': status,
            'error': error,
            'message': message
        };

        res.status(status).send(JSON.stringify(msg));
    };

    // Validation error.
    res.sendValidationError = (details: string[]) => {
        res.sendError(400, 'VALIDATION_ERROR', JSON.stringify(details));
    };

    // 404 error handler
    res.sendNotFoundError = (resource: string) => {
        res.sendError(404, 'RESOURCE_NOT_FOUND', `Resource ${resource} could not be found.`);
    };

    // 403 error hanlder
    res.sendUnauthorizedError = () => {
        res.sendError(403, 'UNAUTHORIZED', 'You are not authorized to complete that action.');
    };

    // 500 error
    res.sendInternalAuthError = () => {
        res.sendError(500, "INTERNAL_AUTHENTICATION_ERROR");
    };

    // Send JSON payload
    res.sendPayload = (payload: any) => {
        let msg = {
            'status': 200,
            'error': 'NONE',
            'message': {}
        };

        Object.assign(msg.message, payload);

        res.status(200).send(JSON.stringify(msg));
    };

    // Send JSON payload verified against a schema
    res.sendSchemedPayload = (payload: any, schema: string) => {
        let validationResult = Validator.validate(payload, schema);

        if (!validationResult.success) {
            res.sendError(500, 'INTERNAL_SCHEMA_ERROR');
        } else {
            res.sendPayload(payload);
        }
    };

};

// The augmentation middleware
function ResponseAugmenter(req: express.Request, res: express.Response, next: Function) {
    augmentResponse(res);
    next();
}

module.exports = () => { return ResponseAugmenter; };
