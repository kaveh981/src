'use strict';

import * as express from 'express';

class PaginationModel {

     /** The specific page of data returned */
    public page: number;
    /** The limit of data returned per page */
    public limit: number;
    /** Optional URL for next page */
    public nextPageURL: string;
    /** Optional URL for prev page */
    public prevPageURL: string;

     /**
     * Constructor
     * @param initParams - Initial parameters to populate the user model.
     * @param req - The request calling the pagination constructor
     */
    constructor(initParams: any = {}, req: express.Request) {

        Object.assign(this, initParams);

        let url = req.originalUrl.split(/v\d+\//)[1].split('?')[0];
        this.nextPageURL = url + `?page=${this.page + 1}&limit=${this.limit}`;
        this.prevPageURL = "";

        if (this.page > 1) {
            this.prevPageURL = url + `?page=${this.page - 1}&limit=${this.limit}`;
        }

    }

    /**
     * Return payload
     */
    public toPayload () {

        return {
            page: this.page,
            limit: this.limit,
            next_page_url: this.nextPageURL,
            prev_page_url: this.prevPageURL
        };

    }

    /**
     * Calculate and return offset for SQL queries 
     */
    public getOffset () {

        return (this.page - 1) * this.limit;

    }

}

export { PaginationModel };
