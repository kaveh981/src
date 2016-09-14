'use strict';

import * as express from 'express';

import { ProtectedRoute } from '../../../middleware/protected-route';

function ActiveDeals(router: express.Router): void {

    router.get('/', ProtectedRoute, (req: express.Request, res: express.Response) => {

        res.sendPayload({'deals': 'Hi, I\'m Rick Harrison, and this is my pawn shop. I work here with my old man and \
        my son, "Big Hoss." Everything in here has a story and a price. One thing I\'ve learned after 21 years - you \
        never know what is gonna come through that door.'});

        let face: any = {};
        face.cow();

        throw "cow";

    });

};

module.exports = ActiveDeals;
