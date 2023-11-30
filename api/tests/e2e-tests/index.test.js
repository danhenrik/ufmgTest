/* eslint-disable max-len */
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;

const app = require('../../src/config/express-config');

describe('E2E Tests', function (done) {
  it('POST api/users/login should return a 403 status code when the email is invalid', function (done) {
    request(app)
      .post('/api/users/login')
      .send({
        email: 'invalid@email.com',
        password: 'securePassword',
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(403);
        expect(res.body).to.equal('E-mail e/ou senha incorretos!');
        done();
      });
  });

  it('POST api/users/logout should return a 404 status code when the token is invalid', function (done) {
    request(app)
      .post('/api/users/logout')
      .set('Accept', 'application/json')
      .set('Cookie', ['jwt=token'])
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(404);
        done();
      });
  });

  it('POST api/users/login should return a 400 status code when the email format is invalid', function (done) {
    request(app)
      .post('/api/users/login')
      .send({
        email: 'invalidemail',
        password: 'securePassword',
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(400);
        done();
      });
  });

  it('POST api/users/resetPassword should return 403 when the user is logged in', function (done) {
    request(app)
      .post('/api/users/login')
      .send({
        email: 'invalid@email.com',
        password: 'securePassword',
      })
      .set('Accept', 'application/json')
      .set('Cookie', ['jwt=token'])
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(403);
        expect(res.body).to.equal('Você já está logado no sistema!');
        done();
      });
  });

  it('POST api/users/resetPassword should return 400 if the provided email is unregistered', function (done) {
    request(app)
      .post('/api/users/login')
      .send({
        email: 'invalidemail.com',
        password: 'securePassword',
      })
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).to.equal(400);
        expect(res.body).to.deep.equal([
          {
            msg: 'O email inserido não é válido',
            param: 'email',
            location: 'body',
          },
        ]);
        done();
      });
  });
});
