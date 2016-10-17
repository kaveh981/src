'use strict';

import { IValidationError } from './raml-type-validator';

class ErrorCreator {

    public createNotFound(message: string): Error {
        let err = new Error(message);
        err.name = 'NOT_FOUND';
        return err;
    }

    public createValidationError(validationError: IValidationError[]): Error {
        let err = new Error(JSON.stringify(validationError));
        err.name = 'BAD_REQUEST';
        return err;
    }

    public createBadRequest(message: string): Error {
        let err = new Error(message);
        err.name = 'BAD_REQUEST';
        return err;
    }

    public createForbidden(message: string): Error {
        let err = new Error(message);
        err.name = 'FORBIDDEN';
        return err;
    }

}

export { ErrorCreator };
