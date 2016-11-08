'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';

import { Injector } from './injector';
import { ConfigLoader } from './config-loader';

/** Configuration from ./config/logger.json */
let loggerConfig: any;

/** The list of write streams, these must be accessible to all loggers. */
let writeStreams: fs.WriteStream[];

/**
 * Standardized message interface to log to file.
 */
interface IMessage {
    /** The ISO date that the message was created at. */
    DATE: string;
    /** The log level of the message. */
    LEVEL: number;
    /** The string of the log level name. */
    LOG_LEVEL: string;
    /** A label to log all of the messages with. */
    LABEL: string;
    /** The name of the component that logged the message. */
    ORIGIN: string;
    /** The message that was logged. */
    MESSAGE: string;
};

/**
 * Basic logging class to be used throughout the program.
 */
class Logger {

    /** Logger name to use as origin */
    private name: string;

    /**
     * Create a new logger object to log with.
     * @param [name='CNSL'] - The name of the logger, should be 4 upper case letters. 
     */
    constructor (name: string = 'CNSL') {
        this.name = name;
    }

    /**
     * Log a fatal error, along with the trace if an error object is passed. These errors prevent the program from running entirely.
     * @param err - A string with the error message, or an error object.
     * @returns The JSON formatted message which was written to a file.
     */
    public fatal(err: string | Error, id?: string): IMessage {

        let errorMessage = this.log((id ? `(${id}) ` : '') + err.toString(), 5);

        if (typeof err !== 'string') {
            this.log(err.stack, 0);
        }

        return errorMessage;

    }

    /**
     * Log an error, along with the trace if an error object is passed. These errors do not kill the program, but prevent
     * an operation from completing.
     * @param err - A string with the error message, or an error object.
     * @returns The JSON formatted message which was written to a file.
     */
    public error(err: string | Error, id?: string): IMessage {

        let errorMessage = this.log((id ? `(${id}) ` : '') + err.toString(), 4);

        if (typeof err !== 'string') {
            this.log(err.stack, 0);
        }

        return errorMessage;

    }

    /**
     * Log a warning. These warnings indicate the potential for a more severe error, but have not stopped an operation.
     * @param text - A string with the warning message.
     * @returns The JSON formatted message which was written to a file.
     */
    public warn(text: string, id?: string): IMessage {
        return this.log((id ? `(${id}) ` : '') + text, 3);
    }

    /**
     * Log information. These messages are for information that should be read.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public info(text: string, id?: string): IMessage {
        return this.log((id ? `(${id}) ` : '') + text, 2);
    }

    /**
     * Log debug information. These messages should be used to log states of large operations.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public debug(text: string, id?: string): IMessage {
        return this.log((id ? `(${id}) ` : '') + text, 1);
    }

    /**
     * Log trace information. These messages should be used to log any information about smaller operations,
     * this includes the error traces.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public trace(text: string, id?: string): IMessage {
        return this.log((id ? `(${id}) ` : '') + text, 0);
    }

    /** 
     * Craft an IMessage object with the given text and log level, and pass it to {@link Logger#outputLog}.
     * @param text - Text to used to craft the message.
     * @param [level=2] - Log level to craft message with.
     * @returns The JSON formatted message which was written to a file.
     */
    public log(text: string, level: number = 2): IMessage {

        // We only need to configure the logger once we log, this prevents annoying dependencies.
        if (!loggerConfig) {
            this.configureLoggers();
        }

        let message: IMessage = this.createMessage(this.name, level, text);
        this.outputLog(message);

        return message;

    }

    /**
     * Writes the message to the console if it is greater than the configured consoleLevel, also write to file.
     * @param message - The JSON message to display, and write to configured files.
     */
    private outputLog(message: IMessage): void {

        let override = loggerConfig['sourceOverrides'][message.ORIGIN];
        let displayMessage = message.LEVEL >= loggerConfig['consoleLevel'];
        let writeMessage = message.LEVEL >= loggerConfig['filewriteLevel'];

        if (override && message.LEVEL < override['consoleLevel']) {
            displayMessage = false;
        }

        if (override && message.LEVEL < override['filewriteLevel']) {
            writeMessage = false;
        }

        if (displayMessage) {
            let msg = `(${this.name}) ${message.DATE.split('T').shift()} [${(message.LOG_LEVEL + ' ').substr(0, 5)}]: ${message.MESSAGE}`;
            let color = loggerConfig['levelMetadata'][message.LEVEL].color;

            console.log(chalk[color](msg));
        }

        if (writeMessage) {
            writeStreams.forEach((stream: fs.WriteStream) => { stream.write(JSON.stringify(message) + '\n'); });
        }

    }

    /**
     * Create a message in the correct format for logging.
     * @param origin - The name of the origin of the message.
     * @param logLevel - The level at which to craft the message.
     * @param message - The actual message.
     * @returns The JSON formatted message.
     */
    private createMessage(origin: string, logLevel: number, message: string): IMessage {

        let date: Date = new Date();

        return {
            DATE: date.toISOString(),
            LEVEL: logLevel,
            LOG_LEVEL: loggerConfig['levelMetadata'][logLevel].name,
            LABEL: 'IXM BUYER API',
            ORIGIN: origin,
            MESSAGE: message
        };

    }

    /**
     * Set up configuration for all the loggers.
     */
    private configureLoggers(): void {

        loggerConfig = Injector.request<ConfigLoader>('ConfigLoader').get('logger');

        writeStreams = loggerConfig['outputFiles'].map((file: string) => {
            return this.createLogWriteStream(file);
        });

    }

    /** 
     * Write stream for file writing needs to be global so that all loggers can access it.
     * @param filename - The filename relative to the root directory of the output file.
     * @returns An fs.WriteStream for the filename specified.
     */
    private createLogWriteStream(filename: string): fs.WriteStream {

        let logFile: string = path.join(__dirname, '../', filename);
        let logFolder: string = path.dirname(logFile);

        if (!fs.existsSync(logFolder)) {
            fs.mkdirSync(logFolder);
        }

        return fs.createWriteStream(logFile, { flags: 'a' });

    }

    /**
     * Meaningful function for humans to print javascript objects
     * @param obj - The object to stringify.
     * @returns A string consisting of the obj properly indented.
     */
    public stringify(obj: any) {
        return JSON.stringify(obj, null, 4);
    }

};

export { Logger };
