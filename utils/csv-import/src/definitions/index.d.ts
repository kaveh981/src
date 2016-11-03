interface IProposal {
    ownerID: number;
    name: string;
    description: string;
    status: 'active' | 'paused' | 'deleted';
    accessMode: number;
    startDate: string;
    endDate: string;
    price: number;
    impressions: number;
    budget: number;
    auctionType: 'fixed' | 'first' | 'second';
    terms: string;
    sectionIDs: number[] | string;
    createDate: null;
    modifyDate: null;
}
