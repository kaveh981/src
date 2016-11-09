'use strict';

import * as Knex from 'knex';
import * as fs from 'fs';

/**
 * Class contains methods to build rollout and rollback SQL script for proposal insertion
 */
class SQLScriptBuilder {

    private queryBuilder: Knex;
    private createDate: Date;

    constructor() {
        this.queryBuilder = Knex({client: 'mysql'});
        this.createDate = new Date();
    }


    /**
     * Build rollout and rollback scripts
     * 
     * @param {string} ticketNumber JIRA Ticket Number for the csv insertion
     * @param {string} path Path to store SQL scripts generated
     * @param {INewProposalData[]} proposals Array of proposal data objects
     */
    public async buildScripts(ticketNumber: string, path: string, proposals: INewProposalData[]) {

        let insertScript = await this.buildInsertScript(ticketNumber, proposals);
        this.writeToFile(path + ticketNumber + "_rollout.sql", insertScript);

        let deleteScript = await this.buildDeleteScript(ticketNumber, proposals);
        this.writeToFile(path + ticketNumber + "_rollback.sql", deleteScript);
    }

    /**
     * Build rollout script to insert proposals and related mappings
     */
    public async buildInsertScript(ticketNumber: string, proposals: INewProposalData[]): Promise<string> {

        let insertScript: string;

        insertScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        insertScript += "TEE /tmp/" + ticketNumber + "_Viper2_rollout.log\n";

        insertScript += this.getExpectedChanges(proposals);

        insertScript += "SET @existing_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        insertScript += "SET @existing_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "START TRANSACTION;\n";

        for (let i = 0; i < proposals.length; i += 1) {
            insertScript += await this.buildInsertQuery(proposals[i].proposal, proposals[i].sectionIDs);
        }

        insertScript += "SET @final_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        insertScript += "SET @final_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "SELECT IF(@final_proposals - @existing_proposals = @expected_proposal_changes,"
                                + "'Delection check OK, Please COMMIT', 'Deletion check FAIL, Please ROLLBACK');\n";

        insertScript += "NOTEE\n";

        return insertScript;
    }

    /**
     * Build rollback script to delete proposals and related mappings
     */
    public async buildDeleteScript(ticketNumber: string, proposals: INewProposalData[]) {

        let deleteScript: string;

        deleteScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        deleteScript += "TEE /tmp/" + ticketNumber + "_Viper2_rollback.log\n";

        deleteScript += this.getExpectedChanges(proposals);

        deleteScript += "SET @existing_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        deleteScript += "SET @existing_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        deleteScript += "START TRANSACTION;\n";

        for (let i = 0; i < proposals.length; i += 1) {
            deleteScript += await this.buildDeleteQuery(proposals[i].proposal, proposals[i].sectionIDs);
        }
        deleteScript += "SET @final_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        deleteScript += "SET @final_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        deleteScript += "SELECT IF(@existing_proposals - @final_proposals = @expected_proposal_changes,"
                                + "'Delection check OK, Please COMMIT', 'Deletion check FAIL, Please ROLLBACK');\n";

        deleteScript += "NOTEE\n";

        return deleteScript;
    }

    /**
     * Build query to insert a proposal and related mappings
     */
    private async buildInsertQuery(proposal: IProposal, sectionIDs: number[]): Promise<string> {

        let query: string;

        proposal.createDate = this.createDate;

        query = await this.queryBuilder.insert(proposal).into('ixmDealProposals').toString() + ";\n";
        query += "SET @last_id = LAST_INSERT_ID();\n";

        sectionIDs.forEach((sectionID: number) => {
            query += "INSERT INTO ixmProposalSectionMappings (proposalID, sectionID) VALUES (@last_id, " + sectionID + ");\n";
        });

        return query;
    }

    /**
     * Build query to delete a proposal and related mappings
     */
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

    /**
     * Get string of SQL commands that store changes of ixmDealProposals table and 
     * ixmProposalSectionMappings table in variables
     */
    public getExpectedChanges(proposals: INewProposalData[]) {
        let changes: string = "SET @expected_proposal_changes = " + proposals.length + ";\n" ;

        let numberOfMappings: number = 0;

        for (let i = 0; i < proposals.length; i += 1) {
            numberOfMappings += proposals[i].sectionIDs.length;
        }

        changes += "SET @expected_mapping_changes = " + numberOfMappings + ";\n";

        return changes;
    }

    /**
     * Write string to file
     */
    private writeToFile(namePath: string, content: string) {

        fs.writeFile(namePath , content, function(err) {
            if (err) {
                return console.log(err);
            }
        });
    }
}

export { SQLScriptBuilder }
