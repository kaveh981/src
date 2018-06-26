'use strict';

import * as express from 'express';

import { Logger } from '../../../lib/logger';
import { Injector } from '../../../lib/injector';
import { DatabaseManager } from '../../../lib/database-manager';
import { HTTPError } from '../../../lib/http-error';
import { Permission } from '../../../middleware/permission';

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
    router.delete('/:proposalID', Permission('write'), async (req: express.Request, res: express.Response, next: Function) => { try {

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

        if (!proposal || !proposal.isReadableByUser(user)) {
            throw HTTPError('404_PROPOSAL_NOT_FOUND');
        } else if (proposal.owner.company.id !== user.company.id) {
            throw HTTPError('403');
        }

        Log.debug(`Beginning transaction, updating proposal ${proposalID} and related negotiations...`, req.id);

        proposal.update({ status: 'deleted' });

        await databaseManager.transaction(async (transaction) => {

            await proposedDealManager.updateProposedDeal(proposal, transaction);

            Log.trace(`Proposal ${proposalID} has been set to deleted.`, req.id);

            await negotiatedDealManager.deleteOwnerNegotiationsFromProposalId(proposal.id, transaction);

            Log.trace(`Deleted all negotiations associated to ${proposalID}.`, req.id);

        });

        res.sendMessage('200_PROPOSAL_DELETED', { proposal_id: proposal.id });

    } catch (error) { next(error); } });

};

module.exports = Proposals;
