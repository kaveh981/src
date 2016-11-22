'use strict';

import * as crypto from 'crypto';

/** 
 * Helper class containing functions that are used frequently.
 */
class Helper {

    /**
     * Convert a JS date object or string to yyyy-mm-dd
     * @param date - A date object or a date string.
     * @returns The UTC date formatted as yyyy-mm-dd
     */
    public static formatDate(date: Date | string) {

        let dateString = date.toString();

        if (dateString.includes('0000-00-00')) {
            return dateString;
        }

        let dateObject = new Date(date);

        if (dateObject.toString() === 'Invalid Date') {
            throw new Error('Invalid date provided.');
        }

        const pad = (val: Number) => { if (val < 10) { return '0' + val; } return val.toString(); };
        return `${dateObject.getUTCFullYear()}-${pad(dateObject.getUTCMonth() + 1)}-${pad(dateObject.getUTCDate())}`;

    }

    /**
     * Returns the current date without milliseconds.
     * @returns The current date without milliseconds.
     */
    public static currentDate() {

        let newDate = new Date();

        newDate.setMilliseconds(0);

        return newDate;

    }

    /**
     * Generate an id consisting of random alpha numeric characters.
     * @param length - The length of the string to generate.
     * @returns A string consisting of random alpha numeric characters.
     */
    public static generateId(length: number) {

        let allowedChars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let id = '';

        for (let i = 0; i < length; i++) {
            let idx = Math.floor(Math.random() * allowedChars.length);
            id += allowedChars[idx];
        }

        return id;

    }

    /**
     * Generates an external deal id.
     * @param proposalId - The proposalId to generate an external deal id for.
     * @param buyerId - The buyer of the deal.
     * @param publisherId - The publisher of the deal.
     */
    public static generateExternalDealId(proposalId: Number, buyerId: Number, publisherId: Number) {

        let cipher = crypto.createCipher('aes-256-ctr', 'only geese eat rats');
        let encrypted = cipher.update(buyerId + '-' + publisherId, 'utf8', 'hex');

        encrypted += cipher.final('hex');

        return `ixm-${proposalId}-${encrypted}`;

    }

    /**
     * Convert a single letter status to a word.
     * @param status - The letter to convert.
     * @returns The word.
     */
    public static statusLetterToWord(status: string): 'active' | 'deleted' | 'paused' | 'inactive' {

        switch (status) {
            case 'A':
                return 'active';
            case 'D':
                return 'deleted';
            case 'P':
                return 'paused';
            case 'N':
            case 'I':
                return 'inactive';
            default:
                throw new Error(`Unknown status: ${status}`);
        }

    }

    /**
     * Convert the matching type integer to a full word
     * @param matchType - An integer representing matching type.
     * @returns The word corresponding to this match type.
     */
    public static matchTypeToWord(matchType: number) {
        switch (matchType) {
            case 1:
                return 'full';
            case 2:
                return 'partial';
            default:
                throw new Error(`Unknown match type: ${matchType}`);
        }
    }

};

export { Helper };
