'use strict';

import * as express from 'express';

import { Injector } from '../../lib/injector';
import { RamlTypeValidator } from '../../lib/raml-type-validator';
import { HTTPError } from '../../lib/http-error';
import { Permission } from '../../middleware/permission';
import { Logger } from '../../lib/logger';

import { PaginationModel } from '../../models/pagination/pagination-model';
import { DealSectionManager } from '../../models/deal-section/deal-section-manager';

const dealSectionManager = Injector.request<DealSectionManager>('DealSectionManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

/**
 * Function that handles internal GET /sections routes
 */
function Section(router: express.Router): void {

    /**
     * GET request to get sections for the current user
     */
    router.get('/', Permission('impersonating'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        validationErrors = validator.validateType(req.query, 'traits/queryParameters/section_filterable', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);

        let user = req.ixmUserInfo;
        let sections = await dealSectionManager.fetchDealSectionsForUser(user, pagination, req.query);

        Log.trace(`Found sections for user ${user.company.id}: ${Log.stringify(sections)}`, req.id);

        res.sendPayload(sections.map((section) => { return section.toPayload(); }), pagination.toPayload());

    } catch (error) { next(error); } });

    /**
     * GET request to get a specific section
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
