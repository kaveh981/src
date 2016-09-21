'use strict';

import * as ramlValidator from 'raml-typesystem';
import * as yamlParser from 'js-yaml';
import * as Promise from 'bluebird';
import * as fs from 'fs';
import * as path from 'path';

import { Logger } from './logger';

const Log: Logger = new Logger('VLDT');

/**
 * Interface for validation results
 */
interface IValidationResult {
    /** Success is 1 if there were no errors, 0 otherwise. */
    success: number;
    /** A list of the validation errors. */
    errors: string[];
}

/**
 * A schema validator class which reads from RAML.
 */
class Validator {

    /** An internal list of all parsed schemas */
    private schemas: ramlValidator.IParsedTypeCollection;

    /**
     * Initialize the validator by loading and validating all schemas in the provided folder.
     * @param schemaDirectory - The directory containing all RAML schemas, relative to root directory.
     * @returns Promise which resolves if all schemas have been loaded and validated.
     */
    public initialize(schemaDirectory: string = './schemas'): Promise<{}> {
        return new Promise((resolve: Function, reject: Function) => {
            Log.info('Loading and validating schemas...');

            schemaDirectory = path.join(__dirname, schemaDirectory);

            let files: string[] = fs.readdirSync(schemaDirectory);
            let typeCollection: any = {
                types: {}
            };
            let typeNames: string[] = [];

            // We need to populate the typeCollection in the correct format to be used by raml-typesystem
            files.forEach((file: string) => {
                Log.debug(`Loading schema ${file}...`);

                let fileContent: string = fs.readFileSync(path.join(schemaDirectory, file), 'utf8');
                let jsonSchema: any = yamlParser.safeLoad(fileContent);

                Object.assign(typeCollection.types, jsonSchema);
                typeNames = typeNames.concat(Object.keys(jsonSchema));

                Log.debug(`Schema ${file} has been loaded.`);
            });

            let schemaList: ramlValidator.IParsedTypeCollection = ramlValidator.loadTypeCollection(typeCollection);

            // Check that all types loaded are valid.
            typeNames.forEach((name: string) => {
                let type: ramlValidator.IParsedType = schemaList.getType(name);

                Log.debug(`Validating schema ${type.name()}...`);

                let validationResult: ramlValidator.IStatus = type.validateType();

                if (validationResult.getErrors().length > 0) {
                    validationResult.getErrors().forEach((error: ramlValidator.IStatus) => {
                        Log.warn(error.getMessage());
                    });

                    throw `Schema validation failed for ${type.name()}.`;
                }
            });

            Log.info(`Schemas have been loaded successfully.`);
            this.schemas = schemaList;
            resolve();
        })
        .catch((err: Error) => {
            Log.error(err);
            throw err;
        });
    }

    /**
     * Validate a json object against a data type.
     * @param target - The JSON object to validate.
     * @param type - The name of the schema type to test against.
     * @returns The result of the validation check.
     */
    public validate(target: any, type: string): IValidationResult {
        let schema: any = this.schemas.getType(type);

        if (schema === null) {
            Log.warn(`Unknown schema type: ${type}.`);

            return {
                success: 0,
                errors: [`Unknown schema type: ${type}.`]
            };
        }

        let result: ramlValidator.IStatus = schema.validate(target);

        if (result.getErrors().length > 0) {
            Log.debug(`Validation failed for ${JSON.stringify(target)} with type ${type}.`);

            // Make the errors pretty.
            let prettyErrors = result.getErrors().map((error) => {
                let msgPath = error.getValidationPathAsString() ? ' for ' + error.getValidationPathAsString() : '';
                let msg = error.getMessage() + msgPath;

                Log.trace(msg);
                return msg;
            });

            return {
                success: 0,
                errors: prettyErrors
            };
        }

        return {
            success: 1,
            errors: []
        };

    }

}

export { Validator }
