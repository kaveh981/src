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
     * Convert a single letter status to a word.
     * @param status - The letter to convert.
     * @returns The word.
     */
    public static statusLetterToWord(status: string): 'active' | 'deleted' | 'paused' {
        switch (status) {
            case 'A':
                return 'active';
            case 'D':
                return 'deleted';
            case 'P':
                return 'paused';
            default:
                return;
        }
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

    public static dealNegotiationToPayload (dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
                                            publisher: INewPubData, buyer: INewBuyerData) {

        return {
            proposal_id: proposal.proposal.proposalID,
            publisher_id: publisher.user.userID,
            publisher_contact: {
                title: 'Warlord',
                name: publisher.user.firstName + ' ' + publisher.user.lastName,
                email_address: publisher.user.emailAddress,
                phone: publisher.user.phone
            },
            buyer_id: buyer.user.userID,
            buyer_contact: {
                title: 'Warlord',
                name: buyer.user.firstName + ' ' + buyer.user.lastName,
                email_address: buyer.user.emailAddress,
                phone: buyer.user.phone
            },
            description: proposal.proposal.description,
            terms: dealNegotiation.terms,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            name: proposal.proposal.name,
            start_date: Helper.formatDate(dealNegotiation.startDate),
            end_date: Helper.formatDate(dealNegotiation.endDate),
            auction_type: proposal.proposal.auctionType,
            price: dealNegotiation.price,
            deal_section_id: proposal.sectionIDs,
            currency: 'USD',
            created_at: dealNegotiation.createDate.toISOString(),
            modified_at: dealNegotiation.modifyDate.toISOString()
        };
    }

    /**
     * From settledDeal
     * - dsp_id, external_id, status, modified_at
     * From dealNegotiation
     * - terms, impressions, budget, start_date, end_date, price
     * From proposal
     * - proposal_id, description, name, auction_type, deal_section_id
     * From publisher
     * - publisher_id, publisher_contact
     * From buyer
     * - buyer_id, buyer_contact
     * @returns - The expected payload
     */
    public static settledDealToPayload (settledDeal: ISettledDealData, dealNegotiation: IDealNegotiationData,
                                        proposal: INewProposalData, publisher: INewPubData, buyer: INewBuyerData) {
        return {
            proposal_id: proposal.proposal.proposalID,
            publisher_id: publisher.user.userID,
            publisher_contact: {
                title: 'Warlord',
                name: publisher.user.firstName + ' ' + publisher.user.lastName,
                email_address: publisher.user.emailAddress,
                phone: publisher.user.phone
            },
            buyer_id: buyer.user.userID,
            buyer_contact: {
                title: 'Warlord',
                name: buyer.user.firstName + ' ' + buyer.user.lastName,
                email_address: buyer.user.emailAddress,
                phone: buyer.user.phone
            },
            dsp_id: settledDeal.settledDeal.dspID,
            description: proposal.proposal.description,
            terms: dealNegotiation.terms,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            name: proposal.proposal.name,
            external_id: settledDeal.settledDeal.externalDealID,
            start_date: Helper.formatDate(dealNegotiation.startDate),
            end_date: Helper.formatDate(dealNegotiation.endDate),
            status: Helper.statusLetterToWord(settledDeal.settledDeal.status),
            auction_type: proposal.proposal.auctionType,
            price: dealNegotiation.price,
            deal_section_id: proposal.sectionIDs,
            currency: 'USD',
            modified_at: (new Date(settledDeal.settledDeal.modifiedDate)).toISOString()
        };
    }

}

export { Helper };
