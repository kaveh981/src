'use strict';

import * as express from 'express';

import { Logger } from '../../../../lib/logger';
import { Injector } from '../../../../lib/injector';
import { RamlTypeValidator } from '../../../../lib/raml-type-validator';
import { HTTPError } from '../../../../lib/http-error';
import { Permission } from '../../../../middleware/permission';

import { ProposedDealManager } from '../../../../models/deals/proposed-deal/proposed-deal-manager';
import { PaginationModel } from '../../../../models/pagination/pagination-model';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const validator = Injector.request<RamlTypeValidator>('Validator');

const Log: Logger = new Logger('ROUT');

function Proposals(router: express.Router): void {

    /**
     * GET request to get all proposal owned by the user's company.
     */
    router.get('/', Permission('read'), async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate request queryy
        let validationErrors = validator.validateType(req.query, 'traits/queryParameters/pageable',
                               { fillDefaults: true, forceOnError: [ 'TYPE_NUMB_TOO_LARGE' ], sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        validationErrors = validator.validateType(req.query, 'traits/queryParameters/deal_filterable', { sanitizeIntegers: true });

        if (validationErrors.length > 0) {
            throw HTTPError('400', validationErrors);
        }

        /** Route logic */
        let pagination = new PaginationModel({ page: req.query.page, limit: req.query.limit }, req);
        let user = req.ixmUserInfo;
        let targetedProposals = await proposedDealManager.fetchProposedDealsOwnedByUser(user, pagination, req.query);

        Log.trace(`Found proposals ${Log.stringify(targetedProposals)} owned by company ${user.company.id}`, req.id);

        res.sendPayload(targetedProposals.map((deal) => { return deal.toPayload(); }), pagination.toPayload());

    } catch (error) { next(error); } });

};

module.exports = Proposals;
