'use strict';

/** node_modules */
import ZSchema = require('z-schema');

/** Lib */
import { Logger } from './logger';
import { ConfigLoader } from './config-loader';
import { SchemaLoader } from './schema-loader';

/**
 * Validator class - Validates parsed entities against standard JSON schemas
 */
class Validator {

    /**
     * private properties:
     * loader - the SchemaLoader used to get schemas by name
     * validator - an instance of ZSchema validator module
     * validatorOptions - the options used to instantiate the ZSchema validator instance
     * logger - logger instance used to log any pertinent information
     */
    private loader: SchemaLoader;
    private validator: ZSchema;
    private validatorOptions: ZSchema.Options;
    private logger: Logger;

    /**
     * Constructs Validator instance
     * @param configLoader{ConfigLoader} - used to load validator config
     * @param schemaLoader{SchemaLoader} - used to load JSON schemas written in YAML
     */
    constructor(configLoader: ConfigLoader, schemaLoader: SchemaLoader) {
        let config = configLoader.get('validator');

        this.loader = schemaLoader;
        this.validatorOptions = config.validatorOptions;
        this.validator = new ZSchema(Object.assign(this.validatorOptions, { customValidator: this.customValidationFunction }));
        this.logger = new Logger('VLDT');

        ZSchema.registerFormat("proposal", (proposal) => {
            let schema = this.loader.getSchema("proposalArray");

            for (let key in schema.items.properties) {
                if (!proposal[key] && typeof schema.items.properties[key].default !== 'undefined') {
                    proposal[key] = schema.items.properties[key].default;
                }
            }
            return true;
        });

        ZSchema.registerFormat("section", (section) => {
            let schema = this.loader.getSchema("sectionArray");

            for (let key in schema.items.properties) {
                if (!section[key] && typeof schema.items.properties[key].default !== 'undefined') {
                    section[key] = schema.items.properties[key].default;
                }
            }
            return true;
        });

    }

    /**
     * Validates an Array of proposal objects against "proposalArray.yaml" schema
     * @param jsonArray{any[]} - an array of objects to be validated 
     * @param schema - the schema to use, defaults to "proposalArray.yaml"
     * @returns {boolean} - true if valid, false if invalid
     */
    public validateProposals(jsonArray: any[], schema: any = this.loader.getSchema('proposalArray')) {

        if (this.validator.validate(jsonArray, schema)) {
            return true;
        } else {
            this.logger.error(JSON.stringify(this.validator.getLastErrors(), undefined, 4));
            return false;
        }

    }

    public validateSections(jsonArray: any[], schema: any = this.loader.getSchema('sectionArray')) {

        if (this.validator.validate(jsonArray, schema)) {
            return true;
        } else {
            this.logger.error(JSON.stringify(this.validator.getLastErrors(), undefined, 4));
            return false;
        }
    }

    /**
     * Customize validation function
     * @private
     * @param {any} report output of validator
     * @param {any} schema schema we defined in conf
     * @param {any} json json object that need to validate
     *
     */
    private customValidationFunction(report, schema, json) {
        let constraints: IConstraints = schema.constraints;

        if (!constraints) { return; }

        for (let constraint in constraints) {
            if (!constraints.hasOwnProperty(constraint)) { return; }

            switch (constraint) {
                case 'dateOrder':
                    constraints.dateOrder.forEach((dates: IDateOrderConstraint) => {
                        let prior = json[dates.prior];
                        let after = json[dates.after];

                        if (after === '0000-00-00' || prior === '0000-00-00') {
                            return;
                        }

                        if (after <= prior) {
                            report.addCustomError('DATE_ORDER_CONSTRAINT_FAILED',
                                'Property "{0}" is not prior to property "{1}"',
                                [ dates.prior, dates.after ], null, schema.description
                            );
                        }
                    });
                    break;
                case 'urlMatch':
                    constraints.urlMatch.forEach((urlMatch: IUrlMatchConstraint) => {

                        let entireSite: number = json[urlMatch.entireSite];
                        let matches: IMatch[] = json[urlMatch.matches];

                        if (entireSite === 1 && matches) {
                            report.addCustomError('UNEXPECTED_MATCHES',
                                'If entireSite is 1, no matches should be provided');
                        }

                        if (entireSite === 0 && !matches) {
                            report.addCustomError('MISSING_MATCHES',
                                'EntireSite is 0, matches must be provided');
                            return;
                        }

                        if (entireSite === 0 && matches) {
                            let seenURLs: string[] = [];

                            matches.forEach((match: IMatch) => {
                                if (seenURLs.indexOf(match.url) !== -1) {
                                    report.addCustomError('DUPLICATED_MATCH_URL',
                                        'Match URL "{0}" is duplicated.',
                                    [ match.url ], null, schema.description);
                                }
                                seenURLs.push(match.url);
                            });
                        }

                    });
                    break;
                default:
                    this.logger.warn(`Constraint: ${constraint} is not a valid constraint keyword}`);
            }
        }
    }

}

export { Validator };
