'use strict';

/**
 * Craft an error to throw in a route.
 * @param message - The message key to use.
 * @param details - The details of the error.
 * @returns A crafted error object for consumption by error-handler.
 */
function HTTPError(message: string, details: any = '') {

    let error = new Error();

    error['name'] = message;
    error['crafted'] = true;
    error['details'] = details;

    return error;

}

export { HTTPError };
