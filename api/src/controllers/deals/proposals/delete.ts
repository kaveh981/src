'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { HTTPError } from '../../../lib/http-error';
import { DatabaseManager } from '../../../lib/database-manager';
import { ProtectedRoute } from '../../../middleware/protected-route';

import { ProposedDealManager } from '../../../models/deals/proposed-deal/proposed-deal-manager';
import { NegotiatedDealManager } from '../../../models/deals/negotiated-deal/negotiated-deal-manager';

const proposedDealManager = Injector.request<ProposedDealManager>('ProposedDealManager');
const negotiatedDealManager = Injector.request<NegotiatedDealManager>('NegotiatedDealManager');
const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');

const Log: Logger = new Logger('ROUT');

/**
 * Function that takes care of /deals route
 */
function Proposals(router: express.Router): void {

    /**
     * DELETE request to delete a specific proposal using the proposal ID.
     * All associated deal negotiations will also be deleted.
     */
    router.delete('/:proposalID', ProtectedRoute, async (req: express.Request, res: express.Response, next: Function) => { try {

        /** Validation */

        // Validate the parameter
        let proposalID = Number(req.params['proposalID']);

        if (isNaN(proposalID)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        }

        /** Route logic */

        // Fetch the desired proposal
        let proposal = await proposedDealManager.fetchProposedDealFromId(proposalID);
        let user = req.ixmUserInfo;

        if (!proposal || proposal.isDeleted()) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (proposal.ownerID !== user.id) {
            throw HTTPError('403');
        }

        Log.debug(`Beginning transaction, updating proposal ${proposalID} and related negotiations...`, req.id);

        await databaseManager.transaction(async (transaction) => {

            proposal.update({ status: 'deleted' });

            await proposedDealManager.updateProposedDeal(proposal, transaction);

            Log.trace(`Proposal ${proposalID} status set to deleted.`, req.id);

            await negotiatedDealManager.deleteNegotiationsFromProposalId(proposalID, user, transaction);

            Log.trace(`All status of negotiations related to proposal ${proposalID} are set to deleted.`, req.id);

        });

        res.sendMessage('200_PROPOSAL_DELETED', { proposal_id: proposal.id });

    } catch (error) { next(error); } });

};

module.exports = Proposals;
