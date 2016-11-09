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
    protected loadedMap = {};

    /** Logger instance specific to each loader instance */
    protected logger: Logger;

    constructor(name: string, folder?: string) {
        this.logger = new Logger(name);

        if (folder) {
            this.setFolder(folder);
        }
    }

    /**
     * Set the folder for the loader.
     * @param folder - The folder to load from.
     * @returns True if the folder exists, false otherwise.
     */
    public setFolder(folder: string) {

        let folderPath = path.join(__dirname, folder);

        if (!fs.existsSync(folderPath)) {
            this.logger.error(`Could not find folder ${folderPath}`);
            return false;
        }

        this.folder = path.join(__dirname, folder);
        return true;

    }

    protected loadFile(name: string) {

        if (!this.folder) {
            throw new Error('No folder has been specified.');
        }

        let filePath = path.join(this.folder, name);

        if (!fs.existsSync(filePath)) {
            throw new Error(`Could not find file at ${filePath}`);
        }

        return fs.readFileSync(filePath).toString();

    }

}

export { Loader };
