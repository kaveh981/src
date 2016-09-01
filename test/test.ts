'use strict';

import * as test from 'tape';


const before = test;
const after = test;


const setup = () => {
    const fixture = {};
    return fixture;
};

const teardown = (fixtures)=> {

};

before('before', (assert)=> {
    assert.pass('Do something before test here');
    assert.end();
});

test('A test with fixtures', (assert)=> {
    const fixture = setup();
    assert.equal(typeof fixture, 'object', 'fixture should return an object');
    teardown(fixture);
    assert.end();
});

after('after', (assert)=> {
    assert.pass('Do something after tests here.');
    assert.end();
});


