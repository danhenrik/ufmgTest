/* eslint-disable max-len */

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const sandbox = require('sinon').createSandbox();

// because of the way the code as constructed the mock need to be done before the require
// so the code doesn't try to connect,throwing an error
const Sequelize = require('sequelize');
const findByPk = sandbox.stub();
const create = sandbox.stub();
const update = sandbox.stub();
const destroy = sandbox.stub();
const findAndCountAll = sandbox.stub();
const findOne = sandbox.stub();
sandbox.stub(Sequelize, 'Sequelize').returns({
  define: () => {
    return {
      sync: () => Promise.resolve(),
      findByPk: findByPk,
      create: create,
      update: update,
      destroy: destroy,
      findAndCountAll: findAndCountAll,
      findOne: findOne,
    };
  },
});

const redis = require('redis');
const exists = sandbox.stub();
const set = sandbox.stub();
const select = sandbox.stub();
const get = sandbox.stub();
const del = sandbox.stub();
const expireat = sandbox.stub();
sandbox.stub(redis, 'createClient').returns({
  exists: exists,
  set: set,
  select: select,
  get: get,
  del: del,
  expireat: expireat,
});

const UserService = require('../../../src/users/services/UserService');

const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const passwordToken = require('../../../src/redis/password-token');

describe('Test UserService', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('getCurrentUser return the user found', async () => {
    const user = {
      email: 'john.doe@ijunior.com',
      personalEmail: 'john.doe@gmail.com',
      name: 'John Doe',
      image: 'default-user-icon.jpg',
      role: 'admin',
    };
    findByPk.resolves(user);

    const res = await UserService.getCurrentUser(1);

    expect(res).to.deep.equal(user);
  });

  it('createUser should create a new user', async () => {
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
    create.resolves();

    await UserService.createUser({});

    expect(create.calledOnce).to.be.true;
  });

  it('createUser should delete user image if an error is thrown during creation', async () => {
    const user = {image: 'image'};
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
    create.rejects();
    const unlinkSpy = sandbox.stub(fs, 'unlink');

    // ignore the error
    await UserService.createUser(user).catch(() => {});

    expect(unlinkSpy.calledOnce).to.be.true;
  });

  it('createUser should throw an error if an error is thrown during creation', () => {
    const user = {image: 'image'};
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
    sandbox.stub(fs, 'unlink');
    create.rejects('error');

    const promise = UserService.createUser(user);

    expect(promise).to.be.rejectedWith('error');
  });

  it('updateUserInfo should update user info', async () => {
    const user = {
      update: sandbox.stub(),
    };
    findByPk.resolves(user);

    await UserService.updateUserInfo(1, {});

    expect(user.update.calledOnce).to.be.true;
  });

  it('updateUserInfo should throw an error if user is not found', () => {
    findByPk.resolves(null);

    const promise = UserService.updateUserInfo(1, {});

    expect(promise).to.be.rejected;
  });

  it('updateUserPassword should update user password', async () => {
    const user = {
      password: 'currentPassword',
      update: sandbox.stub(),
    };
    const payload = {
      newPassword: 'newPassword',
      currentPassword: 'currentPassword',
    };
    findByPk.resolves(user);
    sandbox.stub(bcrypt, 'compare').callsFake((a, b) => a == b);
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');

    await UserService.updateUserPassword(1, payload);

    expect(user.update.calledOnce).to.be.true;
  });

  it('updateUserPassword should throw an error if current password is incorrect', () => {
    const user = {
      password: 'currentPassword',
      update: sandbox.stub(),
    };
    const payload = {
      newPassword: 'newPassword',
      currentPassword: 'anotherPassword',
    };
    findByPk.resolves(user);
    sandbox.stub(bcrypt, 'compare').callsFake((a, b) => a == b);
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');

    const promise = UserService.updateUserPassword(1, payload);

    expect(promise).to.be.rejected;
  });

  it('updateUserPassword should throw an error if new password is equal to current password', () => {
    const user = {
      password: 'currentPassword',
      update: sandbox.stub(),
    };
    const payload = {
      newPassword: 'currentPassword',
      currentPassword: 'currentPassword',
    };
    findByPk.resolves(user);
    sandbox.stub(bcrypt, 'compare').callsFake((a, b) => a == b);
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');

    const promise = UserService.updateUserPassword(1, payload);

    expect(promise).to.be.rejected;
  });

  it('updateUserPassword should throw an error if user is not found', () => {
    findByPk.resolves(null);

    const promise = UserService.updateUserPassword(1, {});

    expect(promise).to.be.rejected;
  });

  it('resetPassword should update user password with new password if the token is valid', async () => {
    sandbox.stub(passwordToken, 'getEmail').resolves('email');
    sandbox.stub(bcrypt, 'hash').resolves('hashedPassword');
    sandbox.stub(passwordToken, 'removeToken').resolves();

    await UserService.resetPassword('token', 'newPassword');

    expect(update.calledOnce).to.be.true;
  });

  it('resetPassword should throw error if token is not found', () => {
    sandbox.stub(passwordToken, 'getEmail').resolves(null);

    const promise = UserService.resetPassword('token', 'newPassword');

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should return a list of users', () => {
    findAndCountAll.resolves({rows: [], count: 0});

    const promise = UserService.getAllUsersByPage({});

    expect(promise).to.eventually.equal({rows: [], count: 0});
  });

  it('getAllUsersByPage should throw if page param is less than 1', () => {
    const promise = UserService.getAllUsersByPage({page: 0});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if page param is not a number', () => {
    const promise = UserService.getAllUsersByPage({page: 'string'});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if orderBy param is invalid', () => {
    const promise = UserService.getAllUsersByPage({orderBy: 'unknownField'});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if order param is invalid', () => {
    const promise = UserService.getAllUsersByPage({order: 'invalid'});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if perPage param is less than 1', () => {
    const promise = UserService.getAllUsersByPage({filter: 'invalid'});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if perPage param is greater than 60', () => {
    const promise = UserService.getAllUsersByPage({perPage: 61});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if perPage param is not a number', () => {
    const promise = UserService.getAllUsersByPage({perPage: 'string'});

    expect(promise).to.be.rejected;
  });

  it('getAllUsersByPage should throw if page param is greater than the number of pages', () => {
    findAndCountAll.resolves({rows: [], count: 0});

    const promise = UserService.getAllUsersByPage({page: 2});

    expect(promise).to.be.rejected;
  });

  it('getUserById should query result', () => {
    const user = {
      username: 'username',
      email: 'email',
    };
    findByPk.resolves(user);

    const promise = UserService.getUserById(1);

    expect(promise).to.eventually.equal(user);
  });

  it('getUserById should throw if query throws', () => {
    findByPk.rejects();

    const promise = UserService.getUserById(1);

    expect(promise).to.be.rejected;
  });

  it('getUserByEmail should query result', () => {
    const user = {
      username: 'username',
      email: 'email',
    };
    findOne.resolves(user);

    const promise = UserService.getUserByEmail('email');

    expect(promise).to.eventually.equal(user);
  });

  it('getUserByEmail should throw if query throws', () => {
    findOne.rejects();

    const promise = UserService.getUserByEmail('email');

    expect(promise).to.be.rejected;
  });

  it('deactivateUser should destroy user', async () => {
    const user = {
      destroy: sandbox.stub(),
    };
    findOne.resolves(user);

    await UserService.deactivateUser('email');

    expect(user.destroy.calledOnce).to.be.true;
  });

  it('deactivateUser should throw if user is already inactive', () => {
    const user = {
      deletedAt: 'date',
    };
    findOne.resolves(user);

    const promise = UserService.deactivateUser('email');

    expect(promise).to.be.rejected;
  });

  it('deactivateUser should throw if query throws', () => {
    findOne.rejects();

    const promise = UserService.deactivateUser('email');

    expect(promise).to.be.rejected;
  });

  it('activateUser should restore user', async () => {
    const user = {
      deletedAt: 'date',
      restore: sandbox.stub(),
    };
    findOne.resolves(user);

    await UserService.activateUser('email');

    expect(user.restore.calledOnce).to.be.true;
  });

  it('activateUser should throw if user is already active', async () => {
    const user = {
      restore: sandbox.stub(),
    };
    findOne.resolves(user);

    const promise = UserService.activateUser('email');

    expect(promise).to.be.rejected;
  });

  it('activateUser should throw if query throws', () => {
    findOne.rejects();

    const promise = UserService.activateUser('email');

    expect(promise).to.be.rejected;
  });
});
