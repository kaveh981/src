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
        this.validator = new ZSchema(this.validatorOptions);
        this.logger = new Logger('VLDT');

        ZSchema.registerFormat("proposal", (proposal) => {

            let defaultFields = {
                description: "",
                startDate: "0000-00-00",
                endDate: "0000-00-00",
                impressions: 0,
                budget: 0,
                auctionType: "second"
            };

            for (let key in defaultFields) {
                if (!proposal[key]) {
                    proposal[key] = defaultFields[key];
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

}

export { Validator };
