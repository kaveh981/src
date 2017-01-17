'use strict';

import * as knex from 'knex';

import { DatabaseManager } from '../../lib/database-manager';
import { UserManager } from '../user/user-manager';
import { MarketUserModel } from './market-user-model';
import { PaginationModel } from '../pagination/pagination-model';

/** Manages the market user model */
class MarketUserManager {

    /** Filter mapping m8 */
    private readonly filterMapping = {
        id: {
            table: 'contact',
            operator: '=',
            column: 'userID'
        },
        status: {
            table: 'contact',
            operator: '=',
            column: 'status'
        },
        email: {
            table: 'contact',
            operator: '=',
            column: 'emailAddress'
        }
    };

    /** Internal database manager */
    private databaseManager: DatabaseManager;

    /** Internal user manager */
    private userManager: UserManager;

    /** Bob the builder */
    constructor(databaseManager: DatabaseManager, userManager: UserManager) {
        this.databaseManager = databaseManager;
        this.userManager = userManager;
    }

    /** 
     * Get a market user from the contact or company id.
     * @param userID - The user id of the contact or company id.
     * @returns A market user.
     */
    public async fetchMarketUserFromId(userID: number): Promise<MarketUserModel> {
        return (await this.fetchMarketUsers(null, (db) => { db.where('contactID', userID); }))[0];
    }

    /**
     * Get a list of all active market users
     * @param pagination - The pagination to use.
     * @param filtering - The filtering to include from filterMapping.
     * @returns A list of active users.
     */
    public async fetchActiveMarketUsers(pagination: PaginationModel, filtering: any) {

        let dbFiltering = this.databaseManager.createFilter(filtering, this.filterMapping);

        return await this.fetchMarketUsers(pagination, dbFiltering,
            (db) => {
                db.where('contact.status', 'A')
                  .where('company.status', 'A');
            });

    }

    /**
     * Get a list of market users matching the clauses.
     * @param pagination - The pagination to use, this is modified.
     * @param clauses - A list of wheres to use.
     * @returns A list of market users matching the clauses.
     */
    public async fetchMarketUsers(pagination: PaginationModel, ...clauses: ((db: knex.QueryBuilder) => any)[]): Promise<MarketUserModel[]> {

        let rows = await this.databaseManager.select('contactID', 'companyID', 'permissions')
                                             .from((db) => {
                                                 db.select('userID as contactID', 'companyID', 'permissions')
                                                   .from('ixmUserCompanyMapping')
                                                   .union((union) => {
                                                       union.select('userID as contactID', 'userID as companyID',
                                                                    this.databaseManager.raw(`'write' as permissions`))
                                                            .from('ixmCompanyWhitelist');
                                                   })
                                                   .as('ixmMarketUsers');
                                             })
                                             .join('users as contact', 'contact.userID', 'contactID')
                                             .join('users as company', 'company.userID', 'companyID')
                                             .where((db) => {
                                                 clauses.forEach(filter => filter(db));
                                             })
                                             .limit(pagination ? pagination.limit + 1 : 251)
                                             .offset(pagination ? pagination.getOffset() : 0);

        if (pagination) {
            if (rows.length <= pagination.limit) {
                pagination.nextPageURL = '';
            } else {
                rows.pop();
            }
        }

        let marketUsers = await Promise.all(rows.map(async (row) => {

            let userInfo = await Promise.parallel({
                company: this.userManager.fetchUserFromId(row.companyID),
                contact: this.userManager.fetchUserFromId(row.contactID)
            });

            return new MarketUserModel({
                company: userInfo.company,
                contact: userInfo.contact,
                readOnly: row.permissions === 'read'
            });

        }));

        return marketUsers as any;

    }

}

export { MarketUserManager };
