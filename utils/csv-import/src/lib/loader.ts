'use strict';

/** node_modules */
import * as fs from 'fs';
import * as path from 'path';

/** Lib */
import { Logger } from './logger';

/** Abstract Loader class, inherited by all other loaders */
class Loader {

    /** Path to load from */
    private folder: string;

    /** Hash-map of already loaded files */
    protected loadedMap: {} = {};

    /** Logger instance specific to each loader instance */
    protected logger: Logger;

    constructor(folder: string, name: string) {
        this.folder = path.resolve(__dirname, folder);
        this.logger = new Logger(name);
    }

    protected loadFile(name: string) {
        let filePath = path.join(this.folder, name);
        return fs.readFileSync(filePath).toString();
    }

}

export { Loader };
