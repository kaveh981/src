interface IProposal {
    proposalID?: number;
    ownerID?: number;
    name?: string;
    description?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    price?: number;
    impressions?: number;
    budget?: number;
    auctionType?: string;
    terms?: string;
    createDate?: Date | string;
    modifyDate?: Date | string;
    sectionIDs: Number[];
}

interface IDateOrderConstraint {
    prior: string;
    after: string;
}

interface IConstraints {
    dateOrder?: IDateOrderConstraint[];
}
