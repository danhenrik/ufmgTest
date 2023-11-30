/* eslint-disable max-len */
const {expect} = require('chai');
const sandbox = require('sinon').createSandbox();

const {requestFilter} = require('../../../src/middlewares/object-filter');

describe('Test object-filter middleware', () => {
  beforeEach(() => {
    sandbox.restore();
  });

  it('requestFilter should return a valid express middleware (3 parameters)', () => {
    const middleware = requestFilter('body', []);

    expect(middleware['length']).to.equal(3);
  });

  it('requestFilter should filter out the unwanted object fields', () => {
    requestFilter('body', ['name', 'age'])(request, {}, () => {});

    expect(Object.keys(request.body)).to.deep.equal(['name', 'age']);
  });

  it('requestFilter should return an empty object if none of the keys are found', () => {
    requestFilter('body', ['page', 'size'])(request, {}, () => {});

    expect(request.body).to.deep.equal({});
  });
});

const request = {
  body: {
    name: 'John',
    age: 22,
    email: 'john@doe.com',
  },
};
