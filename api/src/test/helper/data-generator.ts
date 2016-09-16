// Data Generator Class to create objects that represent our entities based on schemas

const JSF = require('json-schema-faker');

const faker = require('faker');
faker.locale = "es_MX";

import * as Schemas from '../config/data-gen/data-generation-schemas';

interface IUser {
    userID?: number,
    userType?: number,
    status?: 'N' | 'A' | 'D',
    emailAddress: string,
    password: string,
    version?: number,
    firstName: string,
    lastName: string,
    companyName: string,
    address1: string,
    address2?: string,
    city: string,
    state?: string,
    zipCode: string,
    country: string,
    phone: string,
    fax?: string,
    lastLogin?: string, //date
    createDate?: string, //date,
    modifyDate?: string //timestamp
}

class DataGenerator {
    
    private schemas: any = {
        NewBuyer: Schemas.NewBuyer,
        NewPub: Schemas.NewPub
    };
    private jsf = JSF;

    public generateNewBuyer(): IUser {
        return this.jsf(this.schemas.NewBuyer);
    }

}

export const dataGenerator = new DataGenerator();