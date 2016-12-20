'use strict';

import * as mail from 'nodemailer';
const sendmail = require('nodemailer-sendmail-transport');

import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log: Logger = new Logger('MAIL');

/** E-mailer class */
class Mailer implements NotificationMedium {

    /** General config loader */
    private configLoader: ConfigLoader;

    /** Mail transport reference */
    private mailTransporter: mail.Transporter;

    /** Mail specific configurations */
    private notificationConfig: any;

    /** Constructor */
    constructor(configLoader: ConfigLoader) {
        this.configLoader = configLoader;
    }

    /** Initialize a new mailer, and connect it to sendmail. */
    public initialize() {

        Log.info('Initializing Mailer...');

        this.notificationConfig = this.configLoader.get('notification');

        Log.trace('Creating Jason Nathan...');

        this.mailTransporter = mail.createTransport(sendmail({
            path: this.notificationConfig.sendmailPath
        }));

        Log.info('Finished initializing Mailer.');

    }

    /** Send an email to a given address
     * @param to - The email address of the recipient.
     * @param subject - The subject of the email.
     * @param message - The string to send to the recipient.
     */
    public send(to: string, subject: string, message: string) {
        return new Promise((resolve, reject) => {

            let mailOptions = {
                to: to,
                subject: subject,
                text: message
            };

            this.mailTransporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    reject(error);
                    Log.error('Mail:\n' + JSON.stringify(mailOptions, null, 4) + '\nFailed');
                } else {
                    resolve(info.response);
                    Log.trace('Mail:\n' + JSON.stringify(mailOptions, null, 4) + '\nSent');
                }
            });

        });
    }

}

export { Mailer };
