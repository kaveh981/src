'use strict';

import * as express from 'express';

import { Injector } from '../../lib/injector';
import { DealSectionManager } from '../../models/deal-section/deal-section-manager';
import { HTTPError } from '../../lib/http-error';
import { Permission } from '../../middleware/permission';

const dealSectionManager = Injector.request<DealSectionManager>('DealSectionManager');

/**
 * TEST ROUTE PLEASE IGNORE
 */
function Section(router: express.Router): void {

    /**
     * GET request to get contact info for a user
     */
    router.get('/:id', Permission('internal'), async (req: express.Request, res: express.Response, next: Function) => { try {

        let sectionID = req.params['id'];
        let sectionInfo = await dealSectionManager.fetchDealSectionById(sectionID);

        if (!sectionInfo) {
            throw HTTPError('404');
        }

        res.sendPayload(sectionInfo.toPayload());

    } catch (error) { next(error); } });

};

module.exports = Section;
