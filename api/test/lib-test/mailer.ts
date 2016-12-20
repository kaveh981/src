'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { ConfigLoader } from '../../src/lib/config-loader';
import { ProposedDealModel } from '../../src/models/deals/proposed-deal/proposed-deal-model';
import { SettledDealModel } from '../../src/models/deals/settled-deal/settled-deal-model';
import { UserModel } from '../../src/models/user/user-model';
import { Notifier } from '../../src/lib/notifier';
import { Mailer } from '../../src/lib/mailer';

const configLoader = new ConfigLoader('../../', './config');
configLoader.initialize()
.then(() => {
    Injector.put(configLoader, 'ConfigLoader');

    const mailer = new Mailer(configLoader);
    const notifier = new Notifier(configLoader, [ mailer ]);

    mailer.initialize();
    notifier.initialize();

    test('Testing Mailer', async (t) => {

        t.plan(9);

         let proposalBuyer = new UserModel({
             firstName: 'Rat',
             lastName: 'King'
         });
        let proposalOwner = new UserModel({
            emailAddress: 'rat.kings.buddy@sewer.com'
        });
        let proposal = new ProposedDealModel({
            ownerInfo: proposalOwner,
            id: 1,
            name: 'BEST DEAL'
        });
        let settledDeal = new SettledDealModel({
            id: 1,
            auctionType: 'first',
            price: 1,
            startDate: '0000-00-00',
            endDate: '0000-00-00',
            priority: 1
        });

        let r1 = await notifier.sendNotification('PROPOSAL_BOUGHT', proposalBuyer, proposal, settledDeal);
        t.ok(r1 === true);

        let r2 = await notifier.sendNotification('NEGOTIATED_PROPOSAL_BOUGHT', proposalBuyer, proposal, settledDeal);
        t.ok(r2 === true);

        let r3 = await notifier.sendNotification('I_LOST_MY_SHOE', proposalBuyer, proposal, settledDeal);
        t.ok(r3 === false);

        let r4 = await notifier.sendNotification('', proposalBuyer, proposal, settledDeal);
        t.ok(r4 === false);

        let r5 = await notifier.sendNotification(null, proposalBuyer, proposal, settledDeal);
        t.ok(r5 === false);

        let r6 = await notifier.sendNotification('PROPOSAL_BOUGHT', null, proposal, settledDeal);
        t.ok(r6 === false);

        let r7 = await notifier.sendNotification('PROPOSAL_BOUGHT', proposalBuyer, null, settledDeal);
        t.ok(r7 === false);

        let r8 = await notifier.sendNotification('PROPOSAL_BOUGHT', proposalBuyer, proposal, null);
        t.ok(r8 === false);

        let proposalOwner2;

        proposal = new ProposedDealModel({
            ownerInfo: proposalOwner2,
            id: 1,
            name: 'BEST DEAL'
        });

        let r9 = await notifier.sendNotification('PROPOSAL_BOUGHT', proposalBuyer, proposal, settledDeal);
        t.ok(r9 === false);

    });

});
