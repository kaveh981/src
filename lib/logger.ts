'use strict';

import * as fs from 'fs';
import * as path from 'path';

import { ConfigLoader } from './config-loader';

// Write stream for file writing needs to be global so that all loggers can access it.
function createLogWriteStream(filename: string): fs.WriteStream {
    let logDirectory: string = path.join(__dirname, `../logs/`);

    if (!fs.existsSync(logDirectory)) {
        fs.mkdir(logDirectory);
    }

    return fs.createWriteStream(logDirectory + filename, { flags: 'a' });
}

const writeStream: fs.WriteStream = createLogWriteStream('output.log');

// Level of console to display. TODO: Place in config
const consoleLevel: number = 2;

// Log level names
const logLevels: any = {
    "0": "TRACE",
    "1": "DEBUG",
    "2": "INFO",
    "3": "WARN",
    "4": "ERROR",
    "5": "FATAL"
};

// Message interface
interface IMessage {
    DATE: string;
    LEVEL: number;
    LOG_LEVEL: string;
    LABEL: string;
    ORIGIN: string;
    MESSAGE: string;
}

// Basic logger class
class Logger {

    // Logger name to use as origin
    private name: string;

    // Constructor
    constructor (name: string = 'CNSL') {
        this.name = name;
    }

    // Log at various levels with appropriate functions
    public fatal(text: string): IMessage {
        return this.log(text, 5);
    }

    public error(text: string): IMessage {
        return this.log(text, 4);
    }
    public warn(text: string): IMessage {
        return this.log(text, 3);
    }

    public info(text: string): IMessage {
        return this.log(text, 2);
    }

    public debug(text: string): IMessage {
        return this.log(text, 1);
    }

    public trace(text: string): IMessage {
        return this.log(text, 0);
    }

    // Handles message logging
    public log(text: string, level: number = 2): IMessage {
        let message: IMessage = this.createMessage(this.name, level, text);
        this.outputLog(message);
        return message;
    }

    // Write the message to the console if it is greater than the consoleLevel, also write to file.
    private outputLog(message: IMessage): void {
        if (message.LEVEL >= consoleLevel) {
            console.log(`(${this.name.toUpperCase()}) [${message.LOG_LEVEL}]: ${message.MESSAGE}`);
        }

        writeStream.write(JSON.stringify(message) + '\n');
    }

    // Create a message in the correct format for logging.
    private createMessage(origin: string, logLevel: number, message: string): IMessage {
        let date: Date = new Date();

        return {
            DATE: date.toISOString(),
            LEVEL: logLevel,
            LOG_LEVEL: logLevels[logLevel],
            LABEL: "IXM BUYER API",
            ORIGIN: origin,
            MESSAGE: message
        };
    }

};

export { Logger };