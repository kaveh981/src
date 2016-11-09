'use strict';

import * as Knex from 'knex';

class SQLScriptBuilder {

    private queryBuilder: Knex;
    private createDate: Date;

    constructor() {
        this.queryBuilder = Knex({client: 'mysql'});
        this.createDate = new Date();
    }

    public async buildInsertScript(ticketNumber: string, proposals: INewProposalData[]): Promise<string> {
        let insertScript: string;
        insertScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        insertScript += "SET @expected_proposal_insertions = " + proposals.length + ";\n" ;

        let numberOfMappings: number = 0;

        for (let i = 0; i < proposals.length; i += 1) {
            numberOfMappings += proposals[i].sectionIDs.length;
        }

        insertScript += "SET @expected_mapping_insertions = " + numberOfMappings + ";\n";

        insertScript += "TEE /tmp/" + ticketNumber + "_Viper2_rollout.log\n";

        insertScript += "SET @existing_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";

        insertScript += "SET @existing_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "START TRANSACTION;";

        for (let i = 0; i < proposals.length; i += 1) {
            insertScript += await this.buildInsertQuery(proposals[i].proposal, proposals[i].sectionIDs);
        }

        insertScript += "SET @final_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        insertScript += "SET @final_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "NOTEE";

        return insertScript;
    }

    public async buildDeleteScript(ticketNumber: string, proposals: INewProposalData[]) {
        let deleteScript: string;
        deleteScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        deleteScript += "START TRANSACTION;";

        for (let i = 0; i < proposals.length; i += 1) {
            deleteScript += await this.buildDeleteQuery(proposals[i].proposal, proposals[i].sectionIDs);
        }

        deleteScript += "COMMIT;";

        return deleteScript;
    }

    private async buildInsertQuery(proposal: IProposal, sectionIDs: number[]): Promise<string> {

        let query: string;

        proposal.createDate = this.createDate;

        query = await this.queryBuilder.insert(proposal).into('ixmDealProposals').toString() + ";";
        query += "SET @last_id = LAST_INSERT_ID();";

        sectionIDs.forEach((sectionID: number) => {
            query += "INSERT INTO ixmProposalSectionMappings (proposalID, sectionID) VALUES (@last_id, " + sectionID + ");";
        });

        return query;
    }

    private async buildDeleteQuery(proposal: IProposal, sectionIDs: number[]): Promise<string> {
        let query: string;

        proposal.createDate = this.createDate;

        query = "SET @proposal_id = ("  + await this.queryBuilder.select('proposalID')
                                        .from('ixmDealProposals')
                                        .where(proposal)
                                        .toString() + ");";

        query += "DELETE FROM ixmProposalSectionMappings WHERE proposalID = @proposal_id";

        query += "DELETE FROM ixmDealProposals WHERE proposalID = @proposal_id";

        return query;

    }
}
