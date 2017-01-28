'use strict';

import * as knex from 'knex';

import { UserModel } from './user-model';
import { DatabaseManager } from '../../lib/database-manager';
import { PaginationModel } from '../pagination/pagination-model';
import { Helper } from '../../lib/helper';

/** User model manager */
class UserManager {

    private readonly filterMapping = {
        user_id: {
            table: 'users',
            operator: '=',
            column: 'userID'
        },
        status: {
            table: 'users',
            operator: '=',
            column: 'status'
        },
        email: {
            table: 'users',
            operator: '=',
            column: 'emailAddress'
        }
    };

    /**
     * Constructor
     * @param databaseManager - An instance of the database manager.
     */
    constructor (
        private databaseManager: DatabaseManager
    ) {}

    /**
     * Returns a user model from an id.
     * @param userID - The id of the user we want information from.
     * @returns A user model for that user.
     */
    public async fetchUserFromId(userID: number): Promise<UserModel> {

        let user = await this.fetchUsers(null, (db) => { db.where('userID', userID); });

        return user[0];

    }

    /**
     * Returns an array of active users models filtered by additional filter parameters.
     * @param pagination - The pagination parameters. This function modifies this parameter by setting its nextPageURL field based on whether there is more
     * data left to get or not.
     * @param filtering - an object containing filters .
     * @returns An array of user models for users meeting filter requirements.
     */
    public async fetchActiveUsers(pagination: PaginationModel, filtering: {[s: string]: any}) {

        let dbFiltering = this.databaseManager.createFilter(filtering, this.filterMapping);

        return await this.fetchUsers(pagination, dbFiltering, (db) => { db.where('status', 'A'); });

    }

    /**
     * Fetch a user from email.
     * @param email - The email address.
     */
    public async fetchUserFromEmail(email: string) {

        let user = await this.fetchUsers(null, (db) => { db.where('emailAddress', email); });

        return user[0];

    }

    /**
     * Insert a new user into the database.
     * @param user - The user to insert.
     * @param transaction - An optional transaction object to use.
     */
    public async insertUser(user: UserModel, transaction?: knex.Transaction) {

        if (user.id) {
            throw new Error('Attempted to insert an existing user.');
        }

        // If there is no transaction, start one.
        if (!transaction) {
            await this.databaseManager.transaction(async (trx) => {
                await this.insertUser(user, trx);
            });
            return;
        }

        let userTypeNumber = (await transaction.pluck('userTypeID').from('userTypes').where('name', user.userType))[0];

        let userID = await transaction.insert({
            userType: userTypeNumber,
            status: Helper.statusWordToLetter(user.status),
            emailAddress: user.emailAddress,
            password: Helper.generateId(64),
            phone: user.phone,
            country: user.country,
            zipCode: user.zipCode,
            firstName: user.firstName,
            lastName: user.lastName,
            companyName: user.companyName,
            address1: user.address,
            state: user.state,
            city: user.city
        }).into('users').returning('userID');

        user.id = userID[0];

    }

    /**
     * Returns a list of user models filtered by filter parameters.
     * @param pagination - The pagination parameters. This function modifies this parameter by setting its nextPageURL field based on whether there is more
     * data left to get or not.
     * @param ...clauses: knex query builder functions which are used to create optional filters on user query.
     * @returns A list of user models for those users meeting filter requirements.
     */
    public async fetchUsers(pagination: PaginationModel, ...clauses: ((db: knex.QueryBuilder) => any)[]): Promise<UserModel[]> {

        let query = this.databaseManager.select('userID as id', 'status', 'userTypes.name as userType',
                                                'ug.name as userGroup', 'firstName', 'lastName', 'emailAddress', 'phone', 'userTypes.internal',
                                                'companyName', 'address1 as address', 'city', 'zipCode', 'country', 'state')
                                        .from('users')
                                        .innerJoin('userTypes', 'userType', '=', 'userTypeID')
                                        .innerJoin('userGroups as ug', 'userTypes.userGroupID', '=', 'ug.userGroupID')
                                        .where((db) => {
                                            clauses.forEach(filter => filter(db));
                                        });

        if (pagination) {
            query.limit(pagination.limit + 1).offset(pagination.getOffset());
        }

        let rows = await query;

        if (pagination) {
            if (rows.length <= pagination.limit) {
                pagination.nextPageURL = '';
            } else {
                rows.pop();
            }
        }

        let users: UserModel[] = [];

        for (let i = 0; i < rows.length; i++) {
            users[i] = new UserModel({
                id: rows[i].id,
                status:  Helper.statusLetterToWord(rows[i].status),
                userType: rows[i].userType,
                userGroup: rows[i].userGroup,
                firstName: rows[i].firstName,
                lastName: rows[i].lastName,
                emailAddress: rows[i].emailAddress,
                phone: rows[i].phone,
                internal: !!rows[i].internal,
                country: rows[i].country,
                address: rows[i].address,
                companyName: rows[i].companyName,
                city: rows[i].city,
                zipCode: rows[i].zipCode,
                state: rows[i].state
            });
        }

        return users;

    }
}

export { UserManager };
