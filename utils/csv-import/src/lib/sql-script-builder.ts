'use strict';

import * as Knex from 'knex';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Class contains methods to build rollout and rollback SQL script for proposal insertion
 */
class SQLScriptBuilder {

    private queryBuilder: Knex;
    private createDate: string;

    constructor() {
        this.queryBuilder = Knex({client: 'mysql'});
        this.createDate = SQLScriptBuilder.formatDate(new Date());
    }

    /**
     * Build rollout and rollback scripts
     * 
     * @param {string} ticketNumber JIRA Ticket Number for the csv insertion
     * @param {string} directory Path to store SQL scripts generated
     * @param {INewProposalData[]} proposals Array of proposal data objects
     */
    public async buildScripts(ticketNumber: string, directory: string, proposals: IProposal[]) {

        let insertScript = await this.buildInsertScript(ticketNumber, proposals);
        this.writeToFile(path.join(directory, ticketNumber + "_rollout.sql"), insertScript);

        let deleteScript = await this.buildDeleteScript(ticketNumber, proposals);
        this.writeToFile(path.join(directory, ticketNumber + "_rollback.sql"), deleteScript);
    }

    /**
     * Build rollout script to insert proposals and related mappings
     */
    public async buildInsertScript(ticketNumber: string, proposals: IProposal[]): Promise<string> {

        let insertScript: string;

        insertScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        insertScript += "TEE /tmp/" + ticketNumber + "_Viper2_rollout.log\n";

        insertScript += this.getExpectedChanges(proposals);

        insertScript += "SET @existing_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        insertScript += "SET @existing_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "START TRANSACTION;\n";

        for (let i = 0; i < proposals.length; i += 1) {
            insertScript += await this.buildInsertQuery(proposals[i]);
        }

        insertScript += "SET @final_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        insertScript += "SET @final_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        insertScript += "SELECT IF(@final_proposals - @existing_proposals = @expected_proposal_changes,"
                                + "'Insertion check OK, Please COMMIT', 'Insertion check FAIL, Please ROLLBACK');\n";

        insertScript += "NOTEE\n";

        return insertScript;
    }

    /**
     * Build rollback script to delete proposals and related mappings
     */
    public async buildDeleteScript(ticketNumber: string, proposals: IProposal[]) {

        let deleteScript: string;

        deleteScript = "/* JIRA Ticket Number: " + ticketNumber + " Date of Execution: " + this.createDate + " */\n";

        deleteScript += "TEE /tmp/" + ticketNumber + "_Viper2_rollback.log\n";

        deleteScript += this.getExpectedChanges(proposals);

        deleteScript += "SET @existing_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        deleteScript += "SET @existing_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        deleteScript += "START TRANSACTION;\n";

        for (let i = 0; i < proposals.length; i += 1) {
            deleteScript += await this.buildDeleteQuery(proposals[i]);
        }
        deleteScript += "SET @final_proposals = (SELECT COUNT(*) FROM ixmDealProposals);\n";
        deleteScript += "SET @final_mappings = (SELECT COUNT(*) FROM ixmProposalSectionMappings);\n";

        deleteScript += "SELECT IF(@existing_proposals - @final_proposals = @expected_proposal_changes,"
                                + "'Deletion check OK, Please COMMIT', 'Deletion check FAIL, Please ROLLBACK');\n";

        deleteScript += "NOTEE\n";

        return deleteScript;
    }

    /**
     * Build query to insert a proposal and related mappings
     */
    private async buildInsertQuery(proposal: IProposal): Promise<string> {

        let query: string;
        let proposalCopy = Object.assign({}, proposal);
        delete proposalCopy['sectionIDs'];

        proposalCopy.createDate = this.createDate;

        query = await this.queryBuilder.insert(proposalCopy).into('ixmDealProposals').toString() + ";\n";
        query += "SET @last_id = LAST_INSERT_ID();\n";

        proposal.sectionIDs.forEach((sectionID: number) => {
            query += "INSERT INTO ixmProposalSectionMappings (proposalID, sectionID) VALUES (@last_id, " + sectionID + ");\n";
        });

        return query;
    }

    /**
     * Build query to delete a proposal and related mappings
     */
    private async buildDeleteQuery(proposal: IProposal): Promise<string> {

        let query: string;
        let proposalCopy = Object.assign({}, proposal);
        delete proposalCopy['sectionIDs'];
        delete proposalCopy['modifyDate'];

        proposalCopy.createDate = this.createDate;

        query = "SET @proposal_id = ("  + await this.queryBuilder.select('proposalID')
                                        .from('ixmDealProposals')
                                        .where(proposalCopy)
                                        .toString() + "); ";

        query += "DELETE FROM ixmProposalSectionMappings WHERE proposalID = @proposal_id; ";

        query += "DELETE FROM ixmDealProposals WHERE proposalID = @proposal_id; ";

        return query;

    }

    /**
     * Get string of SQL commands that store changes of ixmDealProposals table and 
     * ixmProposalSectionMappings table in variables
     */
    public getExpectedChanges(proposals: IProposal[]) {
        let changes = "SET @expected_proposal_changes = " + proposals.length + ";\n" ;
        let numberOfMappings = 0;

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
    
    private static formatDate(d: Date) {
        const pad = (val: Number) => { if (val < 10) { return '0' + val; } return val.toString(); };
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
               `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
}

export { SQLScriptBuilder }
