'use strict';

import * as express from 'express';

class PaginationModel {

     /** The specific page of data returned */
    public page: number;
    /** The limit of data returned per page */
    public limit: number;

     /**
     * Constructor
     * @param initParams - Initial parameters to populate the user model.
     */
    constructor(initParams?: any) {
        if (initParams) {
            Object.assign(this, initParams);
        }
    }

    public toPayload (req: express.Request) {
        let url = req.protocol + '://' + req.get('host') + req.originalUrl;

        let payload =  {
            page: this.page,
            limit: this.limit,
            nextPageURL: url + `?page=${this.page + 1}&limit=${this.limit}`
        };

        if (this.page > 1) {
            Object.assign(payload, {prevPageURL: url + `?page=${this.page - 1}&limit=${this.limit}`});
        }

        return payload;
    }


}

export { PaginationModel };
