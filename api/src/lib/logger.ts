/* tslint:disable:no-console */

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';

/**
 * Standardized message interface to log to file.
 */
interface IMessage {
    timestamp: string; // ISO8601 standard date for when this message was logged, in UTC.
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'; // A human readable representation of the message severity.
    level_num: number; // An integer representing the message severity.
    origin: string; // The module in the program that is logging the message. This should be 4 upper-case letters.

    log?: string; // A complete message to log.
    message?: string; // A short string identifying the event being logged.

    req_ip?: string; // The ip of the request.
    req_method?: string;
    req_url?: string;
    req_id?: string; // The id of the request.

    res_status?: number; // The numerical status code returned in the response.
    res_error_message?: string; // The error message returned in the response.

    ixm_id?: string; // The user ID of the user in the token.
    ixm_market_id?: any; // A JSON object containing information about the market user using the system.

    error_stack?: string; // The trace of the error
};

/**
 * Basic logging class to be used throughout the program.
 */
class Logger {

    private static writeStreams: fs.WriteStream[] = [];
    private static loggerConfig: any;

    /** Logger name to use as origin */
    private name: string;

    /**
     * Create a new logger object to log with.
     * @param name - The name of the logger, should be 4 upper case letters. 
     */
    constructor (name: string = 'NONE') {
        this.name = name;
    }

    /**
     * Log a fatal error, along with the trace if an error object is passed. These errors prevent the program from running entirely.
     * @param err - A string with the error message, or an error object.
     * @returns The JSON formatted message which was written to a file.
     */
    public fatal(error: Error | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (error instanceof Error) {
            logMessage = this.createMessage(5, {
                message: error.message,
                error_stack: error.stack,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(5, error);
        }

        return this.log(logMessage);

    }

    /**
     * Log an error, along with the trace if an error object is passed.
     * @param err - A string with the error message, or an error object.
     * @returns The JSON formatted message which was written to a file.
     */
    public error(error: Error | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (error instanceof Error) {
            logMessage = this.createMessage(4, {
                message: error.message,
                error_stack: error.stack,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(4, error);
        }

        return this.log(logMessage);

    }

    /**
     * Log a warning. These warnings indicate the potential for a more severe error, but have not stopped an operation.
     * @param text - A string with the warning message.
     * @returns The JSON formatted message which was written to a file.
     */
    public warn(msg: string | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (typeof msg === 'string') {
            logMessage = this.createMessage(3, {
                log: msg,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(3, msg);
        }

        return this.log(logMessage);

    }

    /**
     * Log information. These messages are for information that should be read.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public info(msg: string | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (typeof msg === 'string') {
            logMessage = this.createMessage(2, {
                log: msg,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(2, msg);
        }

        return this.log(logMessage);

    }

    /**
     * Log debug information. These messages should be used to log states of large operations.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public debug(msg: string | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (typeof msg === 'string') {
            logMessage = this.createMessage(1, {
                log: msg,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(1, msg);
        }

        return this.log(logMessage);

    }

    /**
     * Log trace information. These messages should be used to log any information about smaller operations,
     * this includes the error traces.
     * @param text - A string with information to log.
     * @returns The JSON formatted message which was written to a file.
     */
    public trace(msg: string | Partial<IMessage>, id?: string): IMessage {

        let logMessage: IMessage;

        if (typeof msg === 'string') {
            logMessage = this.createMessage(0, {
                log: msg,
                req_id: id
            });
        } else {
            logMessage = this.createMessage(0, msg);
        }

        return this.log(logMessage);

    }

    /**
     * Display and write the message to a file.
     * @param message - The message to write.
     * @returns The same message.
     */
    private log(message: IMessage): IMessage {

        let displayMessage = message.level_num >= this.getConsoleLevel(message.origin);
        let writeMessage = message.level_num >= this.getFilewriteLevel(message.origin);

        if (displayMessage) {
            let color = Logger.loggerConfig['levelMetadata'][message.level_num].color;
            let msg = `(${this.name}) ${message.timestamp.split('T').shift()} [${(message.level + ' ').substr(0, 5).toUpperCase()}]: `
                    + `${message.error_stack || message.log || message.message}`;

            console.log(chalk[color](msg));
        }

        if (writeMessage) {
            Logger.writeStreams.forEach((stream: fs.WriteStream) => { stream.write(JSON.stringify(message) + '\n'); });
        }

        return message;

    }

    /**
     * Create a message in the correct format for logging.
     * @param origin - The name of the origin of the message.
     * @param logLevel - The level at which to craft the message.
     * @param message - The actual message.
     * @returns The JSON formatted message.
     */
    private createMessage(logLevel: number, data: Partial<IMessage>): IMessage {

        let logMessage: IMessage = {
            timestamp: (new Date()).toISOString(),
            level_num: logLevel,
            level: Logger.loggerConfig['levelMetadata'][logLevel].name,
            origin: this.name
        };

        logMessage = Object.assign(logMessage, data);

        return logMessage;

    }

    /**
     * Get the filewrite level corresponding to the given origin.
     * @origin - The 4 letter word indicating the origin.
     * @returns A number which corresponds to the filewrite level of that origin, including overrides.
     */
    public getFilewriteLevel(origin: string) {

        let filewriteLevel = Logger.loggerConfig['filewriteLevel'];

        for (let key in Logger.loggerConfig['sourceOverrides']) {
            if (origin.match(key)) {
                let filewriteOverride = Logger.loggerConfig['sourceOverrides'][key]['filewriteLevel'];

                if (typeof filewriteOverride === 'number') {
                    filewriteLevel = filewriteOverride;
                }

                break;
            }
        }

        return filewriteLevel;

    }

    /**
     * Get the console level corresponding to the given origin.
     * @origin - The 4 letter word indicating the origin.
     * @returns A number which corresponds to the console level of that origin, including overrides.
     */
    public getConsoleLevel(origin: string) {

        let consoleLevel = Logger.loggerConfig['consoleLevel'];

        for (let key in Logger.loggerConfig['sourceOverrides']) {
            if (origin.match(key)) {
                let consoleOverride = Logger.loggerConfig['sourceOverrides'][key]['consoleLevel'];

                if (typeof consoleOverride === 'number') {
                    consoleLevel = consoleOverride;
                }

                break;
            }
        }

        return consoleLevel;

    }

    /**
     * Meaningful function for humans to print javascript objects
     * @param obj - The object to stringify.
     * @returns A string consisting of the obj properly indented.
     */
    public stringify(obj: any) {
        return JSON.stringify(obj, null, 4);
    }

    /**
     * Set up configuration for all the loggers.
     * @param config - The logger configuration.
     */
    public static configureLoggers(config: any): void {

        Logger.loggerConfig = config;

        Logger.writeStreams = config.outputFiles.map((file: string) => {
            let logFile = path.resolve(__dirname, file);
            let logFolder = path.dirname(logFile);

            if (!fs.existsSync(logFolder)) {
                fs.mkdirSync(logFolder);
            }

            return fs.createWriteStream(logFile, { flags: 'a' });
        });

    }

};

export { Logger };
