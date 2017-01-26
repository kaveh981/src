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

    /**
     * Checks if 2 arrays have the same elements.
     * @param: a - array 1
     * @param: b - array 2
     * @returns: true if they are equals, false if not. 
     */
    public static arrayEqual(a: number[], b: number[]) {

        if (a.length !== b.length) {
            return false;
        }

        a.sort();
        b.sort();

        for (let i = 0; i < a.length; i++) {
            if (a[i] - b[i] !== 0) {
                return false;
            }
         }

         return true;

    }

   /**
    * Compares array 'a' with array 'b' and checks what values exist in b that do not exist in a (result.added)
    * Also checks what values are in a that do not exist in b (result.removed)
    * @param: a: number[] - the 'old' array 
    * @param: b: number[] - the 'new' array 
    * @return: result: {added: [...], removed: [...]}
    */
    public static checkDiff (a: number[], b: number []) {

        let hash = {};

        // Create a set of enteries that already exist in array 'a'
        for (let i = 0; i < a.length; i++) {
            hash[a[i]] = 1;
        }

        let result: ArrayDiffResult = {
            added: [],
            removed: []
        };

        for (let i = 0; i < b.length; i++) {
            if (hash[b[i]] !== 1) {
                // element does not exist in hash, therefore it is a new value that needs to be added
                result.added.push(b[i]);
            } else {
                // element does exist in hash, meaning that it was NOT removed
                hash[b[i]]++;
            }
        }

        // Now we need to loop over our hash set and save all values that were removed in array b into result.removed
        for (let i = 0; i < a.length; i++) {
            if (hash[a[i]] === 1) {
                result.removed.push(a[i]);
            }
        }

        return result;
    }

};

export { Helper };
