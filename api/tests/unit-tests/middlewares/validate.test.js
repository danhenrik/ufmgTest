/* eslint-disable max-len */
const {expect} = require('chai');
const sandbox = require('sinon').createSandbox();
const proxyquire = require('proxyquire');

const {validate} = require('../../../src/middlewares/validate');

const fs = require('fs').promises;

describe('Test validate midddleware', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('validate should return a valid express middleware (3 parameters)', () => {
    const middleware = validate();

    expect(middleware['length']).to.equal(3);
  });

  it('validator should proceed when called w/ no validations', async () => {
    const next = sandbox.spy();
    const middleware = validate([]);

    await middleware({}, {}, next);

    expect(next.calledWithExactly()).to.be.true;
  });

  it('validator should proceed when valitation error set is empty', async () => {
    const validations = [{run: sandbox.spy()}, {run: sandbox.spy()}];
    // need to use this proxy library to mock because of the way the library is built
    const validator = proxyquire('../../../src/middlewares/validate', {
      'express-validator': {
        validationResult: () => {
          return {isEmpty: () => true};
        },
      },
    });
    const next = sandbox.spy();
    const middleware = validator.validate(validations);

    await middleware({}, {}, next);

    expect(next.calledWithExactly()).to.be.true;
  });

  it('validator should return error when validation error set is not empty', async () => {
    const validations = [{run: sandbox.spy()}, {run: sandbox.spy()}];
    // need to use this proxy library to mock because of the way the library is built
    // it impacts performance negatively but it's the only way to mock this library
    const validator = proxyquire('../../../src/middlewares/validate', {
      'express-validator': {
        validationResult: () => {
          return {
            isEmpty: () => false,
            errors: [
              {value: 'value1', msg: 'msg1'},
              {value: 'value2', msg: 'msg2'},
            ],
          };
        },
      },
    });
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };
    const middleware = validator.validate(validations);

    await middleware({}, res, () => {});

    expect(res.status.calledWithExactly(400)).to.be.true;
    expect(res.json.calledWithExactly([{msg: 'msg1'}, {msg: 'msg2'}])).to.be
      .true;
  });

  it('validator should unlink saved file if present', async () => {
    const unlinkSpy = sandbox.spy(fs, 'unlink');
    const validations = [{run: sandbox.spy()}, {run: sandbox.spy()}];
    const validator = proxyquire('../../../src/middlewares/validate', {
      'express-validator': {
        validationResult: () => {
          return {
            isEmpty: () => false,
            errors: [
              {value: 'value1', msg: 'msg1'},
              {value: 'value2', msg: 'msg2'},
            ],
          };
        },
      },
    });
    const req = {
      file: {
        filename: 'filename',
      },
    };
    const middleware = validator.validate(validations);

    await middleware(req, {}, () => {});

    expect(unlinkSpy.calledOnce).to.be.true;
  });

  it('validator should forward error to next middleware', async () => {
    const error = Error('error');
    const validations = [{run: sandbox.stub().throws(error)}];
    const next = sandbox.spy();
    const middleware = validate(validations);

    middleware({}, {}, next);

    expect(next.calledWithExactly(error)).to.be.true;
  });
});
