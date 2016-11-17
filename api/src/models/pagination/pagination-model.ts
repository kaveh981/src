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
     */
    constructor(initParams: any = {}, req: express.Request) {

        Object.assign(this, initParams);

        let url = req.protocol + '://' + req.get('host') + req.originalUrl;
        this.nextPageURL = url + `?page=${this.page + 1}&limit=${this.limit}`;
        this.prevPageURL = "";

        if (this.page > 1) {
            this.prevPageURL = url + `?page=${this.page - 1}&limit=${this.limit}`;
        }

    }

    public toPayload () {

        return {
            page: this.page,
            limit: this.limit,
            next_page_url: this.nextPageURL,
            prev_page_url: this.prevPageURL
        };
    }

    public getOffset () {

        return (Number(this.page) - 1) * Number(this.limit);
    }

}

export { PaginationModel };
