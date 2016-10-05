'use strict';

import { IHelperMethods } from "./interfaces/Ihelper-methods";

class HelperMethods implements IHelperMethods {

    /**
     * Changes the date format to yyyy-mm-dd
     * @param date any - date in ISO format
     * @returns date in the format of yyyy-mm-dd
     */
    public dateToYMD(date: any): string {
        date = new Date(date);
        let d: number = date.getDate();
        let m: number = date.getMonth() + 1;
        let y: number = date.getFullYear();
        return '' + y + '-' + (m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);
    }

}
export  { HelperMethods }
