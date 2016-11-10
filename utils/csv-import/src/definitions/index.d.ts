interface IProposal {
    proposalID?: number;
    ownerID?: number;
    name?: string;
    description?: string;
    status?: string;
    accessMode?: number;
    startDate?: Date;
    endDate?: Date;
    price?: number;
    impressions?: number;
    budget?: number;
    auctionType?: string;
    terms?: string;
    createDate?: Date;
    modifyDate?: Date;
    sectionIDs: Number[];
}
