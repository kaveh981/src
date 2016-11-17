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
    constructor(initParams: any = {}) {

        Object.assign(this, initParams);
    }

    public toPayload (req: express.Request) {

        let url = req.protocol + '://' + req.get('host') + req.originalUrl;

        let payload =  {
            pagination: {
                page: this.page,
                limit: this.limit
            },
            nextPageURL: url + `?page=${this.page + 1}&limit=${this.limit}`
        };

        if (this.page > 1) {
            payload['prevPageURL'] = url + `?page=${this.page - 1}&limit=${this.limit}`;
        }

        return payload;
    }

    public getOffset () {

        return (Number(this.page) - 1) * Number(this.limit);
    }

}

export { PaginationModel };
