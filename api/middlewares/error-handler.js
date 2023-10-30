const {JsonWebTokenError} = require('jsonwebtoken');
const {MulterError} = require('multer');
const NotAuthorizedError = require('../errors/NotAuthorizedError');
const MediaTypeError = require('../errors/MediaTypeError');
const InvalidParamError = require('../errors/InvalidParamError');
const TokenError = require('../errors/TokenError');
const QueryError = require('../errors/QueryError');

function errorHandler(error, req, res, next) {
  let message = error.message;
  let status = 500; // Internal Server Error

  if (error.code === 'EBADCSRFTOKEN') {
    status = 403; // Forbidden
    message = 'Token CSRF inválido!';
  }

  if (error instanceof JsonWebTokenError ||
    error instanceof NotAuthorizedError) {
    status = 403; // Forbidden
  }

  if (error instanceof MulterError) {
    status = 413; // Payload Too Large
    message = 'O arquivo não pode passar de 1MB!';
  }

  if (error instanceof MediaTypeError) {
    status = 415; // Unsupported Media Type
  }

  if (error instanceof InvalidParamError) {
    status = 400; // Bad Request
  }

  if (error instanceof TokenError) {
    status = 404; // Not Found
  }

  if (error instanceof QueryError) {
    status = 406; // Not acceptable
  }

  console.log(error);
  res.status(status).json(message);
}

module.exports = errorHandler;
