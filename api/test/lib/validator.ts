'use strict';

import * as test from 'tape';
import * as Promise from 'bluebird';

import { Validator } from '../../src/lib/validator';

test('Validator Test', (assert: test.Test) => {
    assert.plan(2);

    Validator.initialize()
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

                assert.equal(Validator.validate(goodRat, 'Rat').success, 1, 'Good rat should pass validation.');
                assert.equal(Validator.validate(badRat, 'Rat').errors.length, 2,
                    'Bad rat should have two failures, bad diet and bad attitude.');

            })
            .catch((err: Error) => {
                assert.fail('Initialization failed with error: ' + err);
                assert.end();
            });

});
