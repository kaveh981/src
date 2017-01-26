'use strict';

import * as handlebars from 'handlebars';

import { UserModel } from '../models/user/user-model';
import { SettledDealModel } from '../models/deals/settled-deal/settled-deal-model';
import { ProposedDealModel } from '../models/deals/proposed-deal/proposed-deal-model';
import { ConfigLoader } from './config-loader';
import { Logger } from './logger';

const Log = new Logger('NOTF');

class Notifier {

    /** The medium of notification */
    private notificationMediums: NotificationMedium[];

    /** Templates for error messages */
    private templates = {};

    /** Config information */
    private config: ConfigLoader;

    /** On/Off switch */
    private enabled: boolean;

    constructor(config: ConfigLoader, notificationMediums: NotificationMedium[] = []) {
        this.config = config;
        this.notificationMediums = notificationMediums;
    }

    /**
     * Initialize a new notifier, and load templates from notification.yaml
     * @param - schemaDirectory: string - the directory where all the schemas are located 
     */
    public initialize() {

        Log.info('Initializing Notifier...');

        // Load up the mail templates
        let templateStrings = this.config.get('notification')['templates']['en-US'];

        // Check if notifications are enabled
        this.enabled = this.config.get('notification')['enabled'];

        for (let key in templateStrings) {
            this.templates[key] = templateStrings[key];

            Log.trace('Loading ' + key + ' from Notification Templates');

            this.templates[key]['subject'] = handlebars.compile(templateStrings[key]['subject']);
            this.templates[key]['body'] = handlebars.compile(templateStrings[key]['body']);
        }

        Log.info('Initialized Notifier.');

    }

    /**
     * Sends a notification through all the mediums specified 
     * @param - templateKey: string - the kind of message being sent/selected from templates
     * @param - userInfo: UserModel - info about the user buying the proposal 
     * @param - proposal: ProposedDealModel- the proposal being bought 
     * @param - settledDeal: SettledDealModel - the resulting settled deal from transaction 
     * @return - Promise<boolean> to identify success or failure depending on its components 
     */
    public sendNotification(templateKey: string, userInfo: UserModel, proposal: ProposedDealModel, settledDeal: SettledDealModel): Promise<boolean> {
        return new Promise((resolve, reject) => {

            if (this.enabled) {
                let subject;
                let message;

                if (!proposal || !proposal.owner.contact) {
                    Log.error('Invalid Proposal or Proposal Info.');
                    resolve(false);
                    return;
                }

                try {
                    subject = this.templates[templateKey]['subject']();
                    message = this.templates[templateKey]['body'](this.createPayload(userInfo, proposal, settledDeal));
                } catch (error) {
                    Log.error(error);
                    resolve(false);
                    return;
                }

                Promise.all(this.notificationMediums.map(medium => medium.send(proposal.owner.contact.emailAddress, subject, message)))
                    .then(() => {
                        Log.trace('Notifications sent by: ' + this.notificationMediums.map(medium => medium.constructor.name).join(', '));
                        resolve(true);
                    })
                    .catch((error) => {
                        Log.error(error);
                        resolve(false);
                    });
            }

        });
    }

    /**
     * Return a notification as a ready to send JSON object 
     * @param - userInfo: UserModel - info about the user buying the proposal 
     * @param - proposal: ProposedDealModel- the proposal being bought 
     * @param - settledDeal: SettledDealModel - the resulting settled deal from transaction
     * @returns - The model as specified in the API.
     */
    private createPayload(userInfo: UserModel, proposal: ProposedDealModel, settledDeal: SettledDealModel) {

        let startDate = this.formateDate(settledDeal.startDate);
        startDate = startDate !== '' ? startDate : 'Immediate';
        let endDate = this.formateDate(settledDeal.endDate);
        endDate = endDate !== '' ? endDate : 'Ongoing';
        let auctionType = this.formatAuctionType(settledDeal.auctionType);

        return {
            proposalID: proposal.id,
            proposalName: proposal.name,
            proposalBuyer: userInfo.firstName + ' ' + userInfo.lastName,
            dealID: settledDeal.externalDealID,
            auctionType: auctionType,
            price: settledDeal.price,
            startDate: startDate,
            endDate: endDate,
            priority: settledDeal.priority
        };

    }

    /**
     * Convert auction type to a meaningful phrase.
     * @param - auctionType: A string indicating the auction type: 'first', 'second' or 'fixed'.
     * @returns - A string corresponding to the auction type.
     */
    private formatAuctionType(auctionType: string): string {

        switch (auctionType) {
            case 'first':
                return 'First Price';
            case 'second':
                return 'Second Price';
            case 'fixed':
                return 'Fixed Price';

        }

    }

    /**
     * Formats date like '26 January 2017'.
     * @param - date: string representation of Date as 'yyyy-mm-dd'.
     * @returns - Formatted string of the date or '' if @param is '0000-00-00'.
     */
    private formateDate(date: string): string {

        if (date !== '0000-00-00') {
            let months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            let dateParts = date.split('-');

            return dateParts[2] + ' ' + months[+dateParts[1]] + ' ' + dateParts[0];
        }

        return '';

    }

}

export { Notifier };
