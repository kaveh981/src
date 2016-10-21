// Declaration merging goes here.
import * as Knex from 'knex';

declare module './database-manager' {
    // Promise that the dbm will extend knex
    interface DatabaseManager extends Knex {}
}
