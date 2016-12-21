'use strict';

import * as Promise from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as raml from 'raml-1-parser';
import * as handlebars from 'handlebars';
import * as raml2obj from 'raml2obj';

import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log = new Logger('VLDT');

const validator = require('validator');

/**
 * I'm just a validation error.
 */
interface IValidationError {
    error: string;
    message: string;
    path: string;
}

/**
 * Validation options
 */
interface IValidationOptions {
    /** Fill missing properties with their defaults. */
    fillDefaults?: boolean;

    /** Replace errored properties with their defaults. */
    forceDefaults?: boolean;

    /** Force defaults only on specific errors */
    forceOnError?: string[];

    /** Sanitize strings to lowercase and trim trailing whitespace */
    sanitizeString?: boolean;

    /** Sanitize strings that belong to enum types */
    sanitizeStringEnum?: boolean;

    /** Sanitize integers by converting strings to numbers */
    sanitizeIntegers?: boolean;

    /** Sanitize booleans by converting strings to bools */
    sanitizeBooleans?: boolean;

    /** Trim trailing whitespace from strings */
    trimStrings?: boolean;

    /** Remove keys which are null */
    removeNull?: boolean;
}

/**
 * A functional RAML-based validating device.
 */
class RamlTypeValidator {

    /** Keep track of all types. */
    private types = {};

    /** Templates for error messages */
    private templates = {};

    /** Config information */
    private config: ConfigLoader;

    /** Constructimizer */
    constructor(config: ConfigLoader) {
        this.config = config;
    }

    /**
     * Load up all the schemas in the schema directory and parse them.
     * @param schemaDirectory - The directory containing all of the schemas relative to this file.
     */
    public initialize(schemaDirectory: string = '../schemas'): Promise<{}> {

        Log.info('Initializing RAML validator...');

        // First we load up the error templates
        let templateStrings = this.config.get('validator')['en-US'];
        let parsedAPI: any;

        for (let key in templateStrings) {
            this.templates[key] = handlebars.compile(templateStrings[key]);
        }

        // Now we load up the schemas
        schemaDirectory = path.join(__dirname, schemaDirectory);

        if (this.config.get('validator')['file']) {

            let ramlFile = this.config.get('validator')['file'];

            Log.debug(`Loading from ${ramlFile}...`);

            parsedAPI = raml.loadApiSync(path.join(schemaDirectory, ramlFile));

        } else {

            let files: string[] = fs.readdirSync(schemaDirectory);
            let apiFormat: any = { title: 'Goose', types: {} };

            // No schemas :(
            if (!files[0]) {
                Log.info('No schemas found.');
                return;
            }

            // We need to create a fake RAML API spec in order for it to be used by raml-1-parser.
            files.forEach((file: string) => {

                let fileContent: string = fs.readFileSync(path.join(schemaDirectory, file), 'utf8');
                let parsedYAML = yaml.safeLoad(fileContent);

                for (let key in parsedYAML) {
                    Log.debug('Loading ' + key + ' from schemas...');
                    apiFormat.types[key] = parsedYAML[key];
                }

            });

            Log.trace('Parsing RAML...');

            parsedAPI = raml.parseRAMLSync(`#%RAML 1.0\n${yaml.dump(apiFormat)}`);

            if (parsedAPI.errors().length > 0) {
                Log.error(Log.stringify(parsedAPI.errors()));
                throw new Error('Compilation error in schemas.');
            }

            Log.trace('Converting RAML to object...');

        }

        // We parse the raml api object into a JSON object and put it in the types variable.
        return raml2obj.parse(parsedAPI.expand(true).toJSON({ serializeMetadata: false }))
            .then((ramlObj) => {
                this.types = ramlObj['types'];

                if (this.config.get('validator')['loadTraits']) {
                    Log.debug('Loading traits...');
                    Object.assign(this.types, this.parseTraits(ramlObj));
                }

                Log.info('Initialized RAML validator.');
            })
            .catch((err) => {
                Log.error(err);
                throw err;
            });

    }

    /**
     * Validate an object against a loaded RAML type.
     * @param obj - The object to test.
     * @param type - The object type to test against.
     * @param opts - An optional parameter object.
     * @return An array of errors, if there are any.
     */
    public validateType(obj: any, type: string, opts: IValidationOptions = {}): IValidationError[] {

        Log.trace(`Validating ${Log.stringify(obj)} as ${type} with options ${JSON.stringify(opts)}.`);

        let typeObject = this.types[type];

        if (!typeObject) {
            Log.error(new Error(`Invalid object type ${type}.`));
            return [ this.createError('UNKNOWN_TYPE', type, null, '') ];
        }

        let errors = this.validateNode(obj, typeObject, type, opts);

        Log.trace(`Had errors ${Log.stringify(errors)}`);

        return errors;

    }

    /**
     * Recursively validate the value of the node.
     * @param obj - The node to validate.
     * @param node - The node to validate against.
     * @param path - The path of the key, used for error handling.
     * @param fillDefaults - If missing properties should be filled with their defaults.
     * @param forceDefaults - If errored properties should be replaced with their defaults.
     * @returns An array of errors, if there are any.
     */
    private validateNode(obj: any, node: any, path: string, opts: IValidationOptions = {}): IValidationError[] {

        let errors: IValidationError[] = [];

        // If the value is undefined, we are missing it.
        if (typeof obj === 'undefined') {
            if (node.required) {
                errors.push(this.createError('PROPERTY_MISSING', null, node, path));
                return errors;
            }

            return [];
        }

        // Check for additional properties.
        if (typeof node.additionalProperties === 'boolean' && !node.additionalProperties) {
            if (typeof obj === 'object' && !Array.isArray(obj) && node.properties) {
                let nodeKeys = Object.keys(node.properties);
                let additionals = Object.keys(obj).filter((key) => { return nodeKeys.indexOf(key) === -1; });

                if (additionals.length > 0) {
                    additionals.forEach((prop) => {
                        errors.push(this.createError('PROPERTY_ADDITIONAL', prop, node, path + ' -> ' + prop));
                    });
                }
            }
        }

        // Verify all of the properties of the node against obj.
        if (node.properties) {

            let properties: any = [];

            if (!Array.isArray(node.properties)) {
                properties = Object.keys(node.properties).map(key => node.properties[key]);
            } else {
                properties = node.properties;
            }

            for (let property of properties) {

                let key = property.name;

                // Fill defaults for properties if fillDefault is true.
                if (opts.fillDefaults && typeof obj[key] === 'undefined' && typeof property.default !== 'undefined') {
                    obj[key] = property.default;
                }

                // Sanitize string to lower case if desired
                if (opts.sanitizeString && typeof obj[key] === 'string') {
                    obj[key] = obj[key].trim().toLowerCase();
                }

                // Sanitize strings to lower case if the key is an enum
                if (opts.sanitizeStringEnum && typeof obj[key] === 'string' && property.enum) {
                    obj[key] = obj[key].trim().toLowerCase();
                }

                // Trim trailing whitespace from strings
                if (opts.trimStrings && typeof obj[key] === 'string') {
                    obj[key] = obj[key].trim();
                }

                // Sanitize integers to numbers
                if (opts.sanitizeIntegers && typeof obj[key] === 'string' && validator.isInt(obj[key])) {
                    obj[key] = Number(obj[key]);
                }

                // Sanitize booleans
                if (opts.sanitizeBooleans && typeof obj[key] === 'string' && validator.isBoolean(obj[key])) {
                    obj[key] = Boolean(obj[key]);
                }

                // Remove null values
                if (opts.removeNull && obj[key] === null) {
                    delete obj[key];
                }

                let propertyErrors = this.validateNode(obj[key], property, path + ' -> ' + key);

                // If there are errors, and we force defaults, reassign.
                if (opts.forceDefaults && property.default && propertyErrors.length > 0) {
                    obj[key] = property.default;
                } else if (opts.forceOnError && property.default && this.containsErrors(propertyErrors, opts.forceOnError)) {
                    obj[key] = property.default;
                } else {
                    errors = errors.concat(propertyErrors);
                }

            }
        }

        // If the type isn't object, run the type checks
        if (node.type.indexOf('object') === -1) {
            errors = errors.concat(this.validateNodeType(obj, node, path));
        }

        return errors;

    }

    /**
     * Validate the node against a type.
     * @param value - The value to validate.
     * @param node - The node to validate against.
     * @param path - The path to the node.
     * @returns The errors if the value cannot be cast to node.
     */
    private validateNodeType(value: any, node: any, path: string): IValidationError[] {

        let nodeType = node.type;
        let valueString = typeof value === 'object' ? JSON.stringify(value) : value.toString();

        /**
         * Verify enum
         */
        if (node.enum) {
            let enumValue = node.enum.find((val) => {
                return val.toString() === valueString;
            });

            if (!enumValue || enumValue === null) {
                 return [ this.createError('ENUM_INVALID', valueString, node, path) ];
            }
        }

        /**
         * Validate all of the types
         */
        let errors: IValidationError[] = [];

        switch (nodeType) {

            /** Verify booleans */
            case 'boolean':
                if (typeof value !== 'boolean' || !validator.isBoolean(valueString)) {
                    errors.push(this.createError('TYPE_BOOL_INVALID', valueString, node, path));
                }
            break;

            /** Verify integers */
            case 'integer':
                if (!validator.isInt(valueString)) {
                    errors.push(this.createError('TYPE_INT_INVALID', valueString, node, path));
                    break;
                }
            // Fall through to test facets

            /** Verify numbers */
            case 'number':
                if (typeof value !== 'number' || isNaN(Number(valueString))) {
                    errors.push(this.createError('TYPE_NUMB_INVALID', valueString, node, path));
                } else {
                    // Verify number facets
                    if (value < node.minimum) {
                        errors.push(this.createError('TYPE_NUMB_TOO_SMALL', valueString, node, path));
                    }

                    if (value > node.maximum) {
                        errors.push(this.createError('TYPE_NUMB_TOO_LARGE', valueString, node, path));
                    }
                }
            break;

            /** Verify strings */
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(this.createError('TYPE_STRING_INVALID', valueString, node, path));
                } else {
                    // Verify string facets
                    if (value.length < node.minLength) {
                        errors.push(this.createError('TYPE_STRING_TOO_SHORT', valueString, node, path));
                        break;
                    }

                    if (value.length > node.maxLength) {
                        errors.push(this.createError('TYPE_STRING_TOO_LONG', valueString, node, path));
                        break;
                    }

                    if (node.pattern && value.match(node.pattern) === null) {
                        errors.push(this.createError('TYPE_STRING_BAD_PATTERN', valueString, node, path));
                        break;
                    }
                }
            break;

            /** Verify dates */
            case 'date-only':
                let dateOnlyRegex = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/;

                if (!dateOnlyRegex.test(valueString) || !Date.parse(valueString)) {
                    errors.push(this.createError('TYPE_DATE_ONLY_INVALID', valueString, node, path));
                }
            break;

            case 'time-only':
                let timeOnlyRegex = /^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/;

                if (!timeOnlyRegex.test(valueString) || !Date.parse('1992-07-29 ' + valueString)) {
                    errors.push(this.createError('TYPE_TIME_ONLY_INVALID', valueString, node, path));
                }
            break;

            case 'datetime-only':
                let dateTimeOnlyRegex = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]T[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/;

                if (!dateTimeOnlyRegex.test(valueString) || !Date.parse(valueString)) {
                    errors.push(this.createError('TYPE_DATE_TIME_ONLY_INVALID', valueString, node, path));
                }
            break;

            case 'datetime':
                if (!Date.parse(valueString)) {
                    errors.push(this.createError('TYPE_DATETIME_INVALID', valueString, node, path));
                }
            break;

            /** Verify arrays */
            case 'array':
                if (!Array.isArray(value)) {
                    errors.push(this.createError('TYPE_ARRAY_INVALID', valueString, node, path));
                } else {

                    // Verify array facets
                    if (value.length < node.minItems) {
                        errors.push(this.createError('TYPE_ARRAY_TOO_SHORT', valueString, node, path));
                        break;
                    }

                    if (value.length > node.maxItems) {
                        errors.push(this.createError('TYPE_ARRAY_TOO_LONG', valueString, node, path));
                        break;
                    }

                    // Check for unique items
                    if (node.uniqueItems) {
                        let lookupMap = {};
                        let duplicates = false;

                        for (let j = 0; j < value.length; j++) {
                            let stringKey = JSON.stringify(value[j]);

                            if (lookupMap[stringKey]) {
                                duplicates = true;
                                break;
                            } else {
                                lookupMap[stringKey] = 1;
                            }
                        }

                        if (duplicates) {
                            errors.push(this.createError('TYPE_ARRAY_UNIQUE', valueString, node, path));
                            break;
                        }
                    }

                    // Validate all of the items in the array
                    for (let i = 0; i < value.length; i++) {
                        let type: { type: string };

                        if (node.items.type) {
                            type = node.items;
                        } else {
                            type = { type: node.items };
                        }
                        errors = errors.concat(this.validateNode(value[i], type, path + `[${i}]`));
                    }
                }
            break;

            case 'union':
                for (let i = 0; i < node.anyOf.length; i++) {
                    let subNode = node.anyOf[i];
                    let typeErrors = this.validateNode(value, subNode, path);

                    if (typeErrors.length === 0) {
                        errors = [];
                        break;
                    } else {
                        errors = errors.concat(typeErrors);
                    }
                }
            break;

            // If any, do nothing
            case 'any':
            break;

            /**
             * Verify custom types
             */
            default:
                let type = this.types[nodeType];

                if (type) {
                    errors = errors.concat(this.validateNode(value, type, path));
                } else {
                    errors.push(this.createError('UNKNOWN_TYPE', nodeType, node, path));
                }
            break;
        }

        return errors;

    }

    /**
     * Create validation error message
     * @param error - The error code.
     * @param value - The value of the property causing the error.
     * @param node - The node that is causing the error.
     * @param path - The path to the property.
     * @returns A standardized error object.
     */
    private createError(error: string, value: string, node: any, path: string): IValidationError {

        let errorMessage = error;

        if (this.templates[error]) {
            errorMessage = this.templates[error]({
                value: value,
                node: node
            });
        }

        return {
            error: error,
            message: errorMessage,
            path: path
        };

    }

    /** 
     * Check if the errorList contains an error in the errors list.
     * @param errorList - A list of validation errors.
     * @param errors - The list of errors to search for.
     * @returns True if errorList contains one of the errors from errors.
     */
    private containsErrors(errorList: IValidationError[], errors: string[]): boolean {

        for (let i = 0; i < errorList.length; i++) {
            for (let j = 0; j < errors.length; j++) {
                if (errors[j] === errorList[i].error) {
                    return true;
                }
            }
        }
        return false;

    }

    /**
     * Parse RAML traits into types to be used by the validator.
     * 
     */
    private parseTraits(ramlObj) {

        let types = {};

        // Load traits
        if (ramlObj['traits']) {
            for (let trait in ramlObj['traits']) {
                for (let key in ramlObj['traits'][trait]) {
                    if (key === 'name') {
                        continue;
                    }

                    // Create the type node.
                    let newNode = { type: 'object', properties: {} };

                    ramlObj['traits'][trait][key].forEach(type => newNode.properties[type.name] = type);
                    types[`traits/${key}/${trait}`] = newNode;

                    Log.trace(`traits/${key}/${trait}` + Log.stringify(newNode));
                }
            }
        }

        return types;

    }

}

export { RamlTypeValidator, IValidationError }
