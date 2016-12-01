/* tslint:disable */

'use strict';

import * as test from 'tape';

import { Injector } from '../../src/lib/injector';
import { ConfigLoader } from '../../src/lib/config-loader';
import { RamlTypeValidator } from '../../src/lib/raml-type-validator';

const configLoader = new ConfigLoader();
Injector.put(configLoader, 'ConfigLoader');

const validator = new RamlTypeValidator(configLoader);

// Helper function to find if a list of errors has a given error.
function hasError(error: string, errorList: any[]): boolean {
    for (let i = 0; i < errorList.length; i++) {
        if (errorList[i].error === error) {
            return true;
        }
    }

    return false;
}

// Pretty print error
function ppErrors(errorList: any[]): string {
    let errors = [];
    for (let i = 0; i < errorList.length; i++) {
        errors.push(`[Validation Error: (${errorList[i].error}) - ${errorList[i].message} - {${errorList[i].path}}]`);
    }
    return errors.join('\n');
}

// Test validation errors
validator.initialize('../../test/schemas')
    .then(() => {

        // Testing booleans
        test('Testing invalid boolean. Schema - Pet', (t) => {
            t.plan(4);

            let res1 = validator.validateType({
                hp: 50,
                edible: 'goose'
            }, 'Pet');

            let res2 = validator.validateType({
                hp: 30,
                edible: 1
            }, 'Pet');

            let res3 = validator.validateType({
                hp: 30,
                edible: 67
            }, 'Pet');

            let res4 = validator.validateType({
                hp: 30,
                edible: [true]
            }, 'Pet');

            t.ok(hasError('TYPE_BOOL_INVALID', res1), ppErrors(res1));
            t.ok(!hasError('TYPE_BOOL_INVALID', res2), ppErrors(res2));
            t.ok(hasError('TYPE_BOOL_INVALID', res3), ppErrors(res3));
            t.ok(hasError('TYPE_BOOL_INVALID', res4), ppErrors(res4));
        });

        // Testing integers
        test('Testing invalid integer. Schema - Pet', (t) => {
            t.plan(4);

            let res1 = validator.validateType({
                hp: 50.82,
                edible: true
            }, 'Pet');

            let res2 = validator.validateType({
                hp: '30a',
                edible: true
            }, 'Pet');

            let res3 = validator.validateType({
                hp: [30],
                edible: true
            }, 'Pet');

            let res4 = validator.validateType({
                hp: 30,
                edible: true
            }, 'Pet');

            t.ok(hasError('TYPE_INT_INVALID', res1), ppErrors(res1));
            t.ok(hasError('TYPE_INT_INVALID', res2), ppErrors(res2));
            t.ok(hasError('TYPE_INT_INVALID', res3), ppErrors(res3));
            t.ok(!hasError('TYPE_INT_INVALID', res4), ppErrors(res4));
        });

        // Testing strings
        test('Testing invalid string. Schema - Pet', (t) => {
            t.plan(2);

            let res1 = validator.validateType({
                hp: 30,
                edible: true,
                name: [
                    'flappy'
                ]
            }, 'Pet');

            let res2 = validator.validateType({
                hp: 30,
                edible: true,
                name: 'sardino'
            }, 'Pet');

            t.ok(hasError('TYPE_STRING_INVALID', res1), ppErrors(res1));
            t.ok(!hasError('TYPE_STRING_INVALID', res2), ppErrors(res2));
        });

        // Testing date-only
        test('Testing invalid date-only. Schema - Pet', (t) => {
            t.plan(3);

            let res1 = validator.validateType({
                hp: 30,
                edible: true,
                birthday: '1859-05-21'
            }, 'Pet');

            let res2 = validator.validateType({
                hp: 30,
                birthday: '1859-05-89'
            }, 'Pet');

            let res3 = validator.validateType({
                hp: 30,
                birthday: '1859-05-21 13:49:00'
            }, 'Pet');

            t.ok(!hasError('TYPE_DATE_ONLY_INVALID', res1), ppErrors(res1));
            t.ok(hasError('TYPE_DATE_ONLY_INVALID', res2), ppErrors(res2));
            t.ok(hasError('TYPE_DATE_ONLY_INVALID', res3), ppErrors(res3));
        });

        /**
         * More advanced tests
         */
        test('Extending type check - Schema: Turtle, Pet', (t) => {
            t.plan(3);

            let res1 = validator.validateType({
                hp: 40,
                edible: false,
                shellStrength: 38.94,
                eatingPower: 5
            }, 'Turtle');

            let res2 = validator.validateType({
                hp: 40,
                edible: false,
                eatingPower: 5
            }, 'Turtle');

            let res3 = validator.validateType({
                edible: false,
                shellStrength: 38.94,
                eatingPower: 5
            }, 'Turtle');

            console.log('1: ' + ppErrors(res1));
            console.log('2: ' + ppErrors(res2));
            console.log('3: ' + ppErrors(res3));

            t.ok(res1.length === 0);
            t.ok(res2.length > 0);
            t.ok(res3.length > 0);
        });

        test('Property custom type check - Schema: Goose, Turtle, Pet', (t) => {
            t.plan(3);

            let res1 = validator.validateType({
                attack: 8,
                defense: 'peck',
                equipable: false,
                pets: [{
                    hp: 40,
                    edible: false,
                    shellStrength: 38.94,
                    eatingPower: 5
                }]
            }, 'Goose');

            let res2 = validator.validateType({
                attack: 8,
                defense: 'peck',
                equipable: false,
                pets: [{
                    hp: 40,
                    edible: false,
                    eatingPower: 5
                }]
            }, 'Goose');

            let res3 = validator.validateType({
                attack: 8,
                defense: 'peck',
                equipable: false,
                pets: [{
                    edible: false,
                    shellStrength: 38.94,
                    eatingPower: 5
                }]
            }, 'Goose');

            console.log('1: ' + ppErrors(res1));
            console.log('2: ' + ppErrors(res2));
            console.log('3: ' + ppErrors(res3));

            t.ok(res1.length === 0);
            t.ok(res2.length > 0);
            t.ok(res3.length > 0);
        });

        test('Union types - Schema: Dog, Pet, Turtle', (t) => {
            t.plan(3);

            let res1 = validator.validateType({
                eats: {
                    hp: 30
                }
            }, 'Dog');

            let res2 = validator.validateType({
                eats: {
                    hp: 40,
                    shellStrength: 58.5151
                }
            }, 'Dog');

            let res3 = validator.validateType({
                eats: {
                    edible: false
                }
            }, 'Dog');

            console.log('1: ' + ppErrors(res1));
            console.log('2: ' + ppErrors(res2));
            console.log('3: ' + ppErrors(res3));

            t.ok(res1.length === 0);
            t.ok(res2.length === 0);
            t.ok(res3.length > 0);
        });

        test('Forcing defaults - Schema: Cat', (t) => {
            t.plan(9);

            let cat1: any = {
                defense: 'ploof',
                health: 30
            };

            let cat2: any = {
                defense: 'ploof',
                health: 130
            };

            let cat3: any = {
                defense: ['charizard'],
                health: 'pistachio'
            };

            let res1 = validator.validateType(cat1, 'Cat', { fillDefaults: true, forceDefaults: true });

            let res2 = validator.validateType(cat2, 'Cat', { fillDefaults: true, forceDefaults: true });

            let res3 = validator.validateType(cat3, 'Cat', { fillDefaults: true, forceDefaults: true });

            console.log('1: ' + JSON.stringify(cat1));
            console.log('2: ' + JSON.stringify(cat2));
            console.log('3: ' + JSON.stringify(cat3));

            t.ok(res1.length === 0);
            t.ok(res2.length === 0);
            t.ok(res3.length === 0);

            t.equals(cat1.attack, 'meow');
            t.equals(cat2.health, 80);
            t.equals(cat2.attack, 'meow');
            t.equals(cat3.health, 80);
            t.equals(cat3.attack, 'meow');
            t.equals(cat3.defense, 'scratch');

        });

        test('Additional Properties - Schema: Duck', (t) => {
            t.plan(3);

            let res1 = validator.validateType({
                attack: 'tooth',
                defense: 8
            }, 'Duck');

            let res2 = validator.validateType({
                attack: 'tooth',
                defense: 8,
                oops: 'garbage'
            }, 'Duck');

            let res3 = validator.validateType({
                defense: 8,
                oops: 'garbage'
            }, 'Duck');

            console.log('1: ' + ppErrors(res1));
            console.log('2: ' + ppErrors(res2));
            console.log('3: ' + ppErrors(res3));

            t.ok(res1.length === 0);
            t.ok(res2.length > 0);
            t.ok(res3.length > 0);
        });

        test('Fill defaults - Schema: Cat', (t) => {
            t.plan(9);

            let cat1: any = {
                defense: 'ploof',
                health: 30
            };

            let cat2: any = {
                attack: 'woof',
                defense: 'ploof',
                health: 130
            };

            let cat3: any = {};

            let res1 = validator.validateType(cat1, 'Cat', { fillDefaults: true });
            let res2 = validator.validateType(cat2, 'Cat', { fillDefaults: true });
            let res3 = validator.validateType(cat3, 'Cat', { fillDefaults: true });

            console.log('1: ' + JSON.stringify(cat1));
            console.log('2: ' + JSON.stringify(cat2));
            console.log('3: ' + JSON.stringify(cat3));

            t.ok(res1.length === 0);
            t.ok(res2.length > 0);
            t.ok(res3.length === 0);

            t.equals(cat1.attack, 'meow');
            t.equals(cat2.health, 130);
            t.equals(cat2.attack, 'woof');
            t.equals(cat3.health, 80);
            t.equals(cat3.attack, 'meow');
            t.equals(cat3.defense, 'scratch');
        });

    });
