'use strict';

class HttpError {

    public notFound(message: string): Error {
        let err = new Error(message);
        err.name = 'NOT_FOUND';
        return err;
    }

    public badRequest(message: string): Error {
        let err = new Error(message);
        err.name = 'BAD_REQUEST';
        return err;
    }

    public forbidden(message: string): Error {
        let err = new Error(message);
        err.name = 'FORBIDDEN';
        return err;
    }

}

export { HttpError };
