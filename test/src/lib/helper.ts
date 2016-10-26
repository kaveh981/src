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
    public static proposalToPayload(proposal: INewProposalData, publisher: INewPubData) {
        return {
            id: proposal.proposal.proposalID,
            publisher_id: proposal.proposal.ownerID,
            contact: {
                title: 'Warlord',
                name: publisher.user.firstName + ' ' + publisher.user.lastName,
                email_address: publisher.user.emailAddress,
                phone: publisher.user.phone
            },
            name: proposal.proposal.name,
            status: proposal.proposal.status,
            currency: 'USD',
            description: proposal.proposal.description,
            start_date: this.formatDate(proposal.proposal.startDate.toISOString()),
            end_date: this.formatDate(proposal.proposal.endDate.toISOString()),
            price: proposal.proposal.price,
            impressions: proposal.proposal.impressions,
            budget: proposal.proposal.budget,
            auction_type: proposal.proposal.auctionType,
            terms: proposal.proposal.terms,
            created_at: proposal.proposal.createDate.toISOString(),
            modified_at: proposal.proposal.modifyDate.toISOString(),
            deal_section_id: proposal.sectionIDs
        };
    }

}

export { Helper };
