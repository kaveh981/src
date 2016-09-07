'use strict';

import * as test from 'tape';

const before: Function = test;
const after: Function = test;

const setup: any = () => {
    const fixture: any = {};
    return fixture;
};

const teardown: any = (fixtures: any) => {
// Dispose fixture here
};

before('before', (assert: test.Test) => {
    assert.pass('Do something before test here');
    assert.end();
});

test('A test with fixtures', (assert: test.Test) => {
    const fixture: any = setup();
    assert.equal(typeof fixture, 'object', 'fixture should return an object');
    teardown(fixture);
    assert.end();
});

after('after', (assert: test.Test) => {
    assert.pass('Do something after tests here.');
    assert.end();
});
