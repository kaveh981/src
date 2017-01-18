'use strict';

/** HTTP Error Class */
class yeah extends Error {
    public name: string;
    public details: any[];
}

/**
 * Craft an error to throw in a route.
 * @param message - The message key to use.
 * @param details - The details of the error.
 * @returns A crafted error object for consumption by error-handler.
 */
function HTTPError(message: string, details?: any[]) {

    let error = new yeah();

    error.name = message;
    error.details = details;

    return error;

}

export { HTTPError, yeah };
