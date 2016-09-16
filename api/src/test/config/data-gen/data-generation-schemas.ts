let newUserInfo = () => {
    return {
        type: "object",
        properties: {
            emailAddress: {
                chance: {
                    email: {
                        domain: "atw-test.com"
                    }
                }
            },
            status: 'A',
            password: 'ratpoint.jpeg',
            firstName: {
                faker: "name.lastName"
            },
            lastName: {
                faker: "name.firstName"
            },
            companyName: "uSelliBuy",
            address1: {
                faker: "address.streetAddress"
            },
            city: {
                faker: "address.city"
            },
            state: {
                faker: "address.state"
            },
            zipCode: {
                faker: "address.zipCode"
            },
            country: {
                faker: "address.countryCode"
            },
            phone: {
                faker: "phone.phoneNumber"
            }
        },
        required: ["emailAddress", "password", "firstName", "lastName", "address1", "city", "state", "zipCode",
            "country", "phone", "userType", "status"]
    };
};

let newBuyer: any = {};
Object.assign(newBuyer, newUserInfo());
newBuyer.properties.userType = 23;
export const NewBuyer = newBuyer;

let newPub: any = {};
Object.assign(newPub, newUserInfo());
newPub.properties.userType = 18;
export const NewPub = newPub;