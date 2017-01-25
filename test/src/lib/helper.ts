'use strict';

import * as crypto from 'crypto';

import { DatabaseManager } from './database-manager';
import { APIRequestManager } from './request-manager';
import { DatabasePopulator } from './database-populator';
import { Injector } from './injector';

const databaseManager = Injector.request<DatabaseManager>('DatabaseManager');
const apiRequest = Injector.request<APIRequestManager>('APIRequestManager');
const databasePopulator = Injector.request<DatabasePopulator>('DatabasePopulator');

class Helper {

    public static formatDate(dateString: string | Date) {

        if (dateString === null) {
            return null;
        }

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
     * Construct a contact payload form user info
     * @param contact - user object
     * @returns contact payload
     */
    public static contactToPayload(contact: INewUserData): any {
        return contact.status === 'A'
            ? {
                title: 'Warlord',
                name: contact.firstName + ' ' + contact.lastName,
                email: contact.emailAddress,
                phone: contact.phone
            }
            : {
                status: "INACTIVE_USER"
            };
    }
    /**
     * Construct a proposal payload from a proposal.
     * @param proposal - The proposal object.
     * @param owner - The user who own's the proposal buyer/publisher.
     * @returns The expected payload for that proposal.
     */
    public static async proposalToPayload(proposal: INewProposalData, contact?: INewUserData) {
        let requestUser = await databasePopulator.createInternalUser();
        if (proposal.proposal.status === 'deleted') {
            return {
                created_at: proposal.proposal.createDate.toISOString(),
                proposal_id: proposal.proposal.proposalID,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                status: proposal.proposal.status
            };
        } else {
            return {
                auction_type: proposal.proposal.auctionType,
                budget: proposal.proposal.budget,
                owner_id: proposal.proposal.ownerID,
                contact: this.contactToPayload(contact),
                created_at: proposal.proposal.createDate.toISOString(),
                currency: 'USD',
                description: proposal.proposal.description,
                end_date: this.formatDate(proposal.proposal.endDate),
                proposal_id: proposal.proposal.proposalID,
                impressions: proposal.proposal.impressions,
                inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                    let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                    return section;
                })),
                partners: proposal.targetedUsers,
                modified_at: proposal.proposal.modifyDate.toISOString(),
                name: proposal.proposal.name,
                price: proposal.proposal.price,
                start_date: this.formatDate(proposal.proposal.startDate),
                status: proposal.proposal.status,
                terms: proposal.proposal.terms
            };
        }
    }

    public static async dealNegotiationToPayload(dealNegotiation: IDealNegotiationData, proposal: INewProposalData,
        proposalOwner: INewUserData, partner: INewUserData) {

        if (proposal.proposal.status === 'deleted') {
            return {
                proposal: await Helper.proposalToPayload(proposal, proposalOwner),
                partner_id: partner.userID,
                contact: Helper.contactToPayload(partner),
                status: 'closed_by_owner',
                created_at: dealNegotiation.createDate.toISOString(),
                modified_at: dealNegotiation.modifyDate.toISOString()
            };
        } else {
            return {
                proposal: await Helper.proposalToPayload(proposal, proposalOwner),
                partner_id: partner.userID,
                contact: Helper.contactToPayload(partner),
                status: Helper.setNegotiationPayloadStatus(dealNegotiation, partner.userID !== proposalOwner.userID),
                price: dealNegotiation.price,
                impressions: dealNegotiation.impressions,
                budget: dealNegotiation.budget,
                terms: dealNegotiation.terms,
                start_date: Helper.formatDate(dealNegotiation.startDate),
                end_date: Helper.formatDate(dealNegotiation.endDate),
                created_at: dealNegotiation.createDate.toISOString(),
                modified_at: dealNegotiation.modifyDate.toISOString()
            };
        }
    }

    /**
     * Use created models to compute expected payload from the API
     * The payload from deals/active GET differs from the response from deals/active PUT
     * @param settledDeal {ISettledDealData} - rtbDeals entry, associated sectionIDs, associated negotiationID
     * @param dealNegotiation {IDealNegotiationData} - Negotiated properties of the deal
     * @param proposal {INewProposalData} - The original proposal
     * @param partner {INewUserData} - The partner tied to the proposal/deal
     * @returns - The payload we expect to be returned by the API
     */
    public static async dealsActiveGetToPayload (settledDeal: ISettledDealData, dealNegotiation: IDealNegotiationData,
                                        proposal: INewProposalData, partner: INewUserData) {
        let requestUser = await databasePopulator.createInternalUser();
        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner_id: partner.userID,
            partner: Helper.contactToPayload(partner),
            inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                return section;
            })),
            auction_type: settledDeal.settledDeal.auctionType,
            dsp_id: settledDeal.settledDeal.dspID,
            terms: dealNegotiation.terms,
            impressions: dealNegotiation.impressions,
            budget: dealNegotiation.budget,
            external_id: settledDeal.settledDeal.externalDealID,
            start_date: Helper.formatDate(settledDeal.settledDeal.startDate),
            end_date: Helper.formatDate(settledDeal.settledDeal.endDate),
            status: Helper.statusLetterToWord(settledDeal.settledDeal.status),
            price: settledDeal.settledDeal.rate,
            priority: settledDeal.settledDeal.priority,
            created_at: (new Date(settledDeal.settledDeal.createDate)).toISOString(),
            modified_at: (new Date(settledDeal.settledDeal.modifiedDate)).toISOString()
        };
    }

    public static async dealsActivePutToPayload(proposal: INewProposalData,
        owner: INewUserData, buyerCompany: INewCompanyData, modifiedDate: Date, createDate: Date) {

        let requestUser = await databasePopulator.createInternalUser();
        return {
            proposal: {
                proposal_id: proposal.proposal.proposalID,
                name: proposal.proposal.name,
                description: proposal.proposal.description,
                currency: 'USD',
                resource: `deals/proposals/${proposal.proposal.proposalID}`
            },
            partner_id: owner.userID,
            partner: Helper.contactToPayload(owner),
            auction_type: proposal.proposal.auctionType,
            inventory: await Promise.all(proposal.sectionIDs.map(async (id) => {
                let section = (await apiRequest.get(`sections/${id}`, {}, requestUser)).body['data'][0];
                return section;
            })),
            dsp_id: buyerCompany.dspID,
            terms: proposal.proposal.terms,
            impressions: proposal.proposal.impressions,
            budget: proposal.proposal.budget,
            external_id: `ixm-${proposal.proposal.proposalID}-${this.encrypt(buyerCompany.user.userID + '-' + owner.userID)}`,
            start_date: Helper.formatDate(proposal.proposal.startDate),
            end_date: Helper.formatDate(proposal.proposal.endDate),
            status: proposal.proposal.status,
            price: proposal.proposal.price,
            priority: 5,
            created_at: createDate.toISOString(),
            modified_at: modifiedDate.toISOString()
        };

    }

    public static async sectionToPayload(section: INewSectionData) {
        let sectionInfo = section.section;
        return {
            ad_unit_restrictions: sectionInfo.adUnits && sectionInfo.adUnits.map(id => {
                return Helper.adUnitToName(id);
            }).sort(),
            audience_restrictions: sectionInfo.audienceTargetingSegments && sectionInfo.audienceTargetingSegments.sort((a, b) => {
                return a - b;
            }).map(segment => {
                return segment + '';
            }),
            country_restrictions: sectionInfo.countries && sectionInfo.countries.sort(),
            coverage: sectionInfo.percent,
            entire_site: !!sectionInfo.entireSite,
            frequency_restrictions: sectionInfo.rtbDomainDepths && sectionInfo.rtbDomainDepths.map(depthBucket => {
                return Helper.depthBucketToName(depthBucket);
            }).sort(),
            id: sectionInfo.sectionID,
            url_matches: sectionInfo.matches && sectionInfo.matches.map(match => {
                return {
                    url: match.url,
                    matchType: Helper.matchTypeToWord(match.matchType)
                };
            }).sort((a, b) => {
                if (a.url === b.url) {
                    return (a.matchType < b.matchType) ? -1 : (a.matchType > b.matchType) ? 1 : 0;
                } else {
                    return (a.url < b.url) ? -1 : 1;
                }
            }) || [],
            name: sectionInfo.name,
            publisher_id: sectionInfo.userID,
            sites: await Helper.fetchActiveSitesFromSectionId(sectionInfo.sectionID),
            status: Helper.statusLetterToWord(sectionInfo.status)
        };
    }

    public static adUnitToName(adUnitID: number): string {
        switch (adUnitID) {
            case 1:
                return 'Pop-Under';
            case 2:
                return '728x90 (Banner)';
            case 3:
                return '120x600 (Tower)';
            case 4:
                return '300x250 (Rectangle)';
            case 5:
                return '160x600 (Tower)';
            case 6:
                return '336x280 (Rectangle)';
            case 7:
                return '234x60 (Half Banner)';
            case 8:
                return '300x600 (Tower)';
            case 9:
                return '300x50 (Mobile Web)';
            case 10:
                return '320x50 (Mobile Web)';
            case 11:
                return 'Any size (VAST)';
            case 12:
                return '970x250 (Billboard)';
            case 13:
                return '300x1050 (Portrait)';
            case 14:
                return '970x90 (Pushdown)';
            case 15:
                return '180x150 (Rectangle)';
            case 16:
                return '900x550 (Full-Screen)';
            case 17:
                return '800x1100 (Full-Screen Mobile)';
            case 25:
                return '240x400 (Tower)';
            case 30:
                return '320x100 (Mobile Web)';
            case 34:
                return '320x480 (Mobile Web)';
            case 42:
                return '480x320 (Mobile Web)';
            case 63:
                return '468x60 (Mobile Web)';
            case 64:
                return '980x552 (Banner)';
            case 65:
                return '768x432 (banner)';
            case 66:
                return '1920x520 (banner)';
            case 67:
                return '960x270 (banner)';
            case 68:
                return '1600x450 (rectangle)';
            case 69:
                return '2080x585 (rectangle)';
            case 70:
                return '480x270 (rectangle)';
            case 71:
                return '800x450 (rectangle)';
            case 72:
                return '1040x585 (rectangle)';
            case 73:
                return '1920x480 (rectangle)';
            case 74:
                return '640x360 (rectangle)';
            case 75:
                return '1280x720 (rectangle)';
            case 76:
                return '480x600 (tower)';
            case 77:
                return '1920x1080 (rectangle)';
            case 78:
                return '300x60 (banner)';
            case 79:
                return '970x400 (rectangle)';
            case 80:
                return '170x31 (banner)';
            case 81:
                return '620x440 (rectangle)';
            case 82:
                return '545x347 (rectangle)';
            case 83:
                return '545x306 (rectangle)';
            case 84:
                return '970x418 (rectangle)';
            case 85:
                return '300x142 (rectangle)';
            case 86:
                return '240x120 (banner)';
            case 87:
                return '184x64 (banner)';
            case 88:
                return '230x96 (banner)';
            case 89:
                return '460x150 (banner)';
            case 90:
                return '490x120 (banner)';
            case 91:
                return '632x373 (rectangle)';
            case 92:
                return '948x461 (rectangle)';
            case 93:
                return '460x540 (tower)';
            case 94:
                return '152x146 (square)';
            case 95:
                return '304x292 (rectangle)';
            case 96:
                return '310x98 (banner)';
            case 97:
                return '620x196 (banner)';
            case 98:
                return '600x500 (rectangle)';
            case 99:
                return '640x100 (banner)';
            case 100:
                return '640x960 (rectangle)';
            case 101:
                return '265x255 (square)';
            case 102:
                return '530x510 (square)';
            case 103:
                return '755x139 (banner)';
            case 104:
                return '1510x278 (banner)';
            case 105:
                return '1536x2048 (tower)';
            case 106:
                return '1680x95 (banner)';
            case 107:
                return '1440x830 (rectangle)';
            case 108:
                return '200x60 (banner)';
            case 109:
                return '1414x860 (rectangle)';
            case 110:
                return '2048x490 (rectangle)';
            case 111:
                return '2048x1152 (rectangle)';
            case 112:
                return '440x330 (rectangle)';
            case 113:
                return '1280x960 (rectangle)';
            case 114:
                return '800x660 (rectangle)';
            case 115:
                return '610x730 (tower)';
            case 116:
                return '650x650 (square)';
            case 117:
                return '260x260 (square)';
            case 118:
                return '172x104 (banner)';
            case 119:
                return '300x400 (tower)';
            case 120:
                return '963x400 (rectangle)';
            case 121:
                return '900x90 (banner)';
            case 122:
                return '900x350 (banner)';
            case 123:
                return '1200x100 (banner)';
            case 124:
                return '930x372 (rectangle)';
            case 125:
                return '700x150 (banner)';
            default:
                return '';
        }
    }

    public static depthBucketToName(depthBucket: number) {
        switch (depthBucket) {
            case 0:
                return '1 - 2';
            case 1:
                return '3 - 6';
            case 2:
                return '7 - 14';
            case 3:
                return '15 - 30';
            case 4:
                return '31 - 62';
            case 5:
                return '63 - 126';
            case 6:
                return '127 - 254';
            case 7:
                return '255(max)';
            default:
                return '';
        }
    }

    public static matchTypeToWord(matchType: number) {
        switch (matchType) {
            case 1:
                return 'full';
            case 2:
                return 'partial';
            default:
                return '';
        }
    }

    public static encrypt(text) {
        let cipher = crypto.createCipher('aes-256-ctr', 'only geese eat rats');
        let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

     /**
      * Determines the status to return to the user based on buyer and publisher status
      */
    private static setNegotiationPayloadStatus(dealNegotiation: IDealNegotiationData, isOwner: boolean) {

        if (isOwner) {
            if (dealNegotiation.ownerStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.ownerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.partnerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.partnerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        } else {
            if (dealNegotiation.partnerStatus === 'active') {
                return 'waiting_on_you';
            } else if (dealNegotiation.partnerStatus === 'rejected') {
                return 'rejected_by_you';
            } else if (dealNegotiation.ownerStatus === 'active') {
                return 'waiting_on_partner';
            } else if (dealNegotiation.ownerStatus === 'rejected') {
                return 'rejected_by_partner';
            }
        }

        return 'accepted';

    }

    public static async getProposalById(proposalID: number) {
         let proposal: IProposal = await databaseManager.select().from('ixmProposals').where('proposalID', proposalID);
         return proposal;
     }

     public static async getNegotiationsByProposalID(proposalID: number) {
         let negotiations: IDealNegotiationData[] = await databaseManager.select().from('ixmNegotiations')
             .where('proposalID', proposalID);
         return negotiations;
     }

     public static async getDealsByProposalID(proposalID: number) {
         let negotiations: ISettledDeal[] = await databaseManager.select().from('rtbDeals')
             .join('ixmNegotiationDealMappings', 'ixmNegotiationDealMappings.dealID', 'rtbDeals.dealID')
             .join('ixmNegotiations', 'ixmNegotiations.negotiationID', 'ixmNegotiationDealMappings.negotiationID')
             .where('ixmNegotiations.proposalID', proposalID);
         return negotiations;
     }

     // Site fetching helper functions. Temporary solution till proper site models are implemented.

     public static async getSiteFromId(siteID: number) {

        let rows = await databaseManager.select('userID as publisherID', 'sites.siteID as id', 'sites.status', 'mainDomain as url',
                                                     'monthlyUniques', 'sites.name as name', 'categories.name as categories',
                                                     'description')
                                             .from('sites')
                                             .leftJoin('siteCategories', 'siteCategories.siteID', 'sites.siteID')
                                             .leftJoin('categories', 'categories.categoryID', 'siteCategories.categoryID')
                                             .where('sites.siteID', siteID);

        if (!rows[0]) {
            return;
        }

        return {
            id: rows[0].id,
            publisher_id: rows[0].publisherID,
            name: rows[0].name,
            url: rows[0].url,
            categories: rows.filter((row) => { return !!row.categories; }).map((row) => { return row.categories; }),
            uniques: rows[0].monthlyUniques,
            description: rows[0].description,
            inventory: [{
                ad_unit: '1337x420',
                video: true,
                devices: [ 'kerosene-powered cheese grater', 'goober' ]
            }],
            impressions: 666
        };

    }

    public static async fetchActiveSitesFromSectionId(sectionID: number) {

        let rows = await databaseManager.select('sites.siteID')
                                             .from('rtbSiteSections')
                                             .join('sites', 'sites.siteID', 'rtbSiteSections.siteID')
                                             .where({
                                                 'sectionID': sectionID,
                                                 'sites.status': 'A'
                                             });

        let sites = (await Promise.all(rows.map(row => {
            return Helper.getSiteFromId(row.siteID);
        }).filter(site => !!site)));

        return sites;

    }

}

export { Helper };
