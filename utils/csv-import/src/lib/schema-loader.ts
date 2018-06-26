'use strict';

/** node_modules */
import * as yaml from 'js-yaml';

/** Lib */
import { Loader } from './loader';

/**
 * SchemaLoader class. Loads YAML schemas from static path directory and parses to JSON
 */
class SchemaLoader extends Loader {

    /**
     * Constructs an instance of SchemaLoader. 
     * @param schemasPath - Static path to schemas directory. Defaults to "../../schemas"
     */
    constructor(schemasPath: string = '../../schemas') {
        super('SLOA', schemasPath);
    }

    /**
     * Returns a JSON schema.
     * @param name - the name of the file to load without ".yaml" extension
     * @returns {any} - the loaded schema
     */
    public getSchema(name: string) {
        if (!this.loadedMap[name]) {
            this.loadSchema(name);
        }

        return this.loadedMap[name];
    }

    /**
     * Loads a schema from file, parses it to JSON and saves it to the loadedMap
     * @param name - the name of the file to load without ".yaml" extension
     */
    private loadSchema(name: string) {
        let fileContents = super.loadFile(name + '.yaml');

        this.loadedMap[name] = yaml.safeLoad(fileContents);
    }
}

export { SchemaLoader };
