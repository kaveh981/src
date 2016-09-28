'use strict';

import * as test from 'tape';
import * as Promise from 'bluebird';

import { Injector } from '../../src/lib/injector';
import { ConfigLoader } from '../../src/lib/config-loader';

const config = new ConfigLoader();
Injector.put(config, 'ConfigLoader');

import { Validator } from '../../src/lib/validator';

const validator = new Validator();

/**
 * Unit test of validator Initialization
 */
test('Validator Test', (assert: test.Test) => {
    assert.plan(2);

    validator.initialize('../../test/schemas')
            .then(() => {
                let goodRat: any = {
                    name: 'Meow',
                    diet: ['human meat', 'frogs legs']
                };

                let badRat: any = {
                    name: 'Woof',
                    diet: 'rabbits',
                    attitude: 'bad'
                };

                assert.equal(validator.validate(goodRat, 'Rat').success, 1, 'Good rat should pass validation.');
                assert.equal(validator.validate(badRat, 'Rat').errors.length, 2,
                    'Bad rat should have two failures, bad diet and bad attitude.');

            })
            .catch((err: Error) => {
                assert.fail('Initialization failed with error: ' + err);
                assert.end();
            });

});
