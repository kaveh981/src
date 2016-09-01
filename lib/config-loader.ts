'use strict';

import * as fs from 'fs';
import * as path from 'path';

// Simple configuration loader, reads from the config folder.
class ConfigLoader {

    // Load the configuration from ./config/filename, returns content as JSON object.
    public static loadConfig(filename: string): JSON {

        let configContent: JSON;
        let fileContent: string;
        let filepath: string = path.join(__dirname, `../config/${filename}`);

        try {
            fileContent = fs.readFileSync(filepath).toString();
            configContent = JSON.parse(fileContent);
        } catch (e) {
            throw e;
        }

        return configContent;
    }
}

export { ConfigLoader };
