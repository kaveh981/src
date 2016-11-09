'use strict';

import {SQLScriptBuilder} from './sql-script-builder';

let builder = new SQLScriptBuilder();

let abc: INewProposalData = {
    proposal: {
        ownerID: 100188,
        name: 'somename',
        description: 'somedesc',
        status: 'active',
        accessMode: 1,
        startDate: new Date(),
        endDate: new Date(),
        price: 15,
        impressions: 1,
        budget: 2,
        auctionType: 'second',
        terms: 'someterm',
        createDate: new Date(),
        modifyDate: new Date()
    },
    sectionIDs: [82]
};

let bcd: INewProposalData = {
    proposal: {
        ownerID: 100188,
        name: 'somename1',
        description: 'somedesc',
        status: 'active',
        accessMode: 1,
        startDate: new Date(),
        endDate: new Date(),
        price: 15,
        impressions: 1,
        budget: 2,
        auctionType: 'second',
        terms: 'someterm',
        createDate: new Date(),
        modifyDate: new Date()
    },
    sectionIDs: [82]
};
builder.buildScripts("ATW-248", "./", [abc, bcd]);
