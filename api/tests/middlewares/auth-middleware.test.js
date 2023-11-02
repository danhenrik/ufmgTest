/* eslint-disable max-len */
const {expect} = require('chai');
const sandbox = require('sinon').createSandbox();

const {
  checkRole,
  // jwtMiddleware,
  // loginMiddleware,
  notLoggedIn,
} = require('../../src/middlewares/auth-middlewares');

const PermissionError = require('../../src/errors/PermissionError');
const jwt = require('jsonwebtoken');

describe('Test auth middlewares', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('checkRole should return a valid express middleware (3 parameters)', () => {
    const middleware = checkRole('admin');

    expect(middleware['length']).to.equal(3);
  });

  it('checkRole should proceed if role is equal to req.user.role', () => {
    const req = {
      user: {
        role: 'admin',
      },
    };
    const res = {};
    const next = sandbox.spy();

    checkRole('admin')(req, res, next);

    expect(next.calledWithExactly()).to.be.true;
  });

  it('checkRole should forward a PermissionError if role is not equal to req.user.role', () => {
    const req = {
      user: {
        role: 'user',
      },
    };
    const res = {};
    const next = sandbox.spy();

    checkRole('admin')(req, res, next);

    expect(next.calledWithExactly(sandbox.match.instanceOf(PermissionError))).to.be.true;
  });

  // it('jwtMiddleware should be a valid express middleware (3 parameters)', () => {
  //   expect(jwtMiddleware['length']).to.equal(3);
  // });

  // flow is very complex, test only if really needed

  // it('loginMiddleware should be a valid express middleware (3 parameters)', () => {
  //   expect(loginMiddleware['length']).to.equal(3);
  // });

  // flow is very complex, test only if really needed

  it('notLoggedIn should return a valid express middleware (3 parameters)', () => {
    const middleware = notLoggedIn('errorMessage');

    expect(middleware['length']).to.equal(3);
  });

  it('notLoggedIn should proceed if token is not present', () => {
    const req = {
      cookies: {},
    };
    const res = {};
    const next = sandbox.spy();

    notLoggedIn()(req, res, next);

    expect(next.calledWithExactly()).to.be.true;
  });

  it('notLoggedIn should proceed if token is expired', () => {
    const req = {
      cookies: {
        jwt: 'token',
      },
    };
    const res = {};
    const next = sandbox.spy();
    sandbox.stub(jwt, 'verify').callsFake((t, s, callback) => {
      callback(new jwt.TokenExpiredError(), {});
    });

    notLoggedIn()(req, res, next);

    expect(next.calledWithExactly()).to.be.true;
  });

  it('notLoggedIn should forward error if token but present and not expired', () => {
    const req = {
      cookies: {
        jwt: 'token',
      },
    };
    const res = {};
    const next = sandbox.spy();
    sandbox.stub(jwt, 'verify').callsFake((t, s, callback) => {
      callback(new Error(), {});
    });

    notLoggedIn()(req, res, next);

    expect(next.calledWithExactly(sandbox.match.instanceOf(PermissionError))).to.be.true;
  });
});
