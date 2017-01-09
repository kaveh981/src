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
    targetedUsers: Number[];
}

interface ISection {
    userID?: number;
    name?: string;
    percent?: number;
    entireSite?: number;
    matches?: IMatch[];
    fullMatchesURL?: string[];
    partialMatchesURL?: string[];
    siteIDs?: number[];
    frequencyRestrictions?: number[];
    audienceRestrictions?: number[];
    countryRestrictions?: string[];
    adUnitRestrictions?: number[];
}

interface IMatch {
    matchType: number;
    url: string;
}

interface ISectionResult {
    userID?: number;
    name?: string;
    percent?: number;
    entireSite?: number;
    matches?: IMatch[];
    fullMatchesURL?: string[];
    partialMatchesURL?: string[];
    siteIDs?: number[];
    frequencyRestrictions?: number[];
    audienceRestrictions?: number[];
    countryRestrictions?: string[];
    adUnitRestrictions?: number[];
    responseCode: string;
    responseErrors?: any;
    newSectionID?: number;
}

interface IDateOrderConstraint {
    prior: string;
    after: string;
}

interface IUrlMatchConstraint {
    entireSite: string;
    matches: string;
}

interface IConstraints {
    dateOrder?: IDateOrderConstraint[];
    urlMatch?: IUrlMatchConstraint[];
}
