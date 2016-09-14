'use strict';

import * as express from 'express';

function Deals(router: express.Router): void {

    router.get('/', (req: express.Request, res: express.Response) => {

        res.sendPayload({deals: 'Hi, I\'m Rick Harrison, and this is my pawn shop. I work here with my old man and \
        my son, "Big Hoss." Everything in here has a story and a price. One thing I\'ve learned after 21 years - you \
        never know what is gonna come through that door.'});

    });

};

module.exports = Deals;
