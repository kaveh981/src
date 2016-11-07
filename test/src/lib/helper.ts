'use strict';

class Helper {

    public static formatDate(dateString: string | Date) {
        dateString = dateString.toString();
        let date = new Date(dateString.toString());

        if (dateString.includes('0000-00-00')) {
            return '0000-00-00';
        }

        if (date.toString() === 'Invalid Date') {
            throw new Error('Invalid date provided.');
        }

        const pad = (val: Number) => { if (val < 10) { return '0' + val; } return val.toString(); };
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
    }

    /**
     * Construct a proposal payload from a proposal.
     * @param proposal - The proposal object.
     * @param publisher - The publisher object that owns the proposal.
     * @returns The expected payload for that proposal.
     */
    public static proposalToPayload(proposal: INewProposalData, owner: INewUserData) {

        return {
            auction_type: proposal.proposal.auctionType,
            budget: proposal.proposal.budget,
            contact: {
                title: 'Warlord',
                name: owner.firstName + ' ' + owner.lastName,
                email: owner.emailAddress,
                phone: owner.phone
            },
            created_at: proposal.proposal.createDate.toISOString(),
            currency: 'USD',
            description: proposal.proposal.description,
            end_date: this.formatDate(proposal.proposal.endDate.toISOString()),
            id: proposal.proposal.proposalID,
            impressions: proposal.proposal.impressions,
            inventory: proposal.sectionIDs,
            modified_at: proposal.proposal.modifyDate.toISOString(),
            name: proposal.proposal.name,
            price: proposal.proposal.price,
            owner_id: proposal.proposal.ownerID,
            start_date: this.formatDate(proposal.proposal.startDate.toISOString()),
            status: proposal.proposal.status,
            terms: proposal.proposal.terms,
        };
    }

    public static dealNegotiationToPayload(dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
    user: INewUserData) {
        return {
            id: proposal.proposal.proposalID,
            name: proposal.proposal.name,
            description: proposal.proposal.description,
            auction_type: proposal.proposal.auctionType,
            inventory: proposal.sectionIDs,
            currency: 'USD',
            start_date: Helper.formatDate(dealNegotiation.startDate),
            end_date: Helper.formatDate(dealNegotiation.endDate),
            price: dealNegotiation.price,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            partner: {
                id: user.userID,
                contact: {
                    title: 'Warlord',
                    name: user.firstName + ' ' + user.lastName,
                    email: user.emailAddress,
                    phone: user.phone
                }
            },
            terms: dealNegotiation.terms,
            created_at: dealNegotiation.createDate.toISOString(),
            modified_at: dealNegotiation.modifyDate.toISOString()
        };
    }

}

export { Helper };
