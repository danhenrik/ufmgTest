/* eslint-disable max-len */
const {expect} = require('chai');
const sandbox = require('sinon').createSandbox();

const errorHandler = require('../../../src/middlewares/error-handler');

const {
  InvalidParamError,
  MediaTypeError,
  NotAuthorizedError,
  QueryError,
  TokenError,
} = require('../../../src/errors');
const {JsonWebTokenError} = require('jsonwebtoken');
const {MulterError} = require('multer');

describe('Test error handler middleware', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('errorHandler return a valid express error handler (4 parameters)', () => {
    expect(errorHandler['length']).to.equal(4);
  });

  it('errorHandler should return status 403 if error is JsonWebTokenError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new JsonWebTokenError(), req, res, () => {});

    expect(res.status.calledWithExactly(403)).to.be.true;
  });

  it('errorHandler should return status 403 if error is NotAuthorizedError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new NotAuthorizedError(), req, res, () => {});

    expect(res.status.calledWithExactly(403)).to.be.true;
  });

  it('errorHandler should return status 413 if error is MulterError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new MulterError(), req, res, () => {});

    expect(res.status.calledWithExactly(413)).to.be.true;
  });

  it('errorHandler should return status 415 if error is MediaTypeError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new MediaTypeError(), req, res, () => {});

    expect(res.status.calledWithExactly(415)).to.be.true;
  });

  it('errorHandler should return status 400 if error is InvalidParamError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new InvalidParamError(), req, res, () => {});

    expect(res.status.calledWithExactly(400)).to.be.true;
  });

  it('errorHandler should return status 404 if error is TokenError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new TokenError(), req, res, () => {});

    expect(res.status.calledWithExactly(404)).to.be.true;
  });

  it('errorHandler should return status 406 if error is QueryError', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new QueryError(), req, res, () => {});

    expect(res.status.calledWithExactly(406)).to.be.true;
  });

  it('errorHandler should return status 500 if error is not handled', () => {
    const req = {};
    const res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
    };

    errorHandler(new Error(), req, res, () => {});

    expect(res.status.calledWithExactly(500)).to.be.true;
  });
});
