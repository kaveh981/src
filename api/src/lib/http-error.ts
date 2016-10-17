'use strict';

class HttpError {

    public static notFound(message: string): Error {
        let err = new Error(message);
        err.name = 'NOT_FOUND';
        return err;
    }

    public static badRequest(message: string): Error {
        let err = new Error(message);
        err.name = 'BAD_REQUEST';
        return err;
    }

    public static forbidden(message: string): Error {
        let err = new Error(message);
        err.name = 'FORBIDDEN';
        return err;
    }

}

export { HttpError };
