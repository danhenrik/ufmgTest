require('dotenv').config();

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

const cookieParser = require('cookie-parser');
app.use(cookieParser());

require('./auth');

app.use(express.urlencoded({
  extended: true,
}));
app.use(express.json());

const csrf = require('csurf');
app.use(csrf({cookie: true}));
app.get('/api/csrf', (req, res, next) => {
  try {
    res.status(200).send(req.csrfToken());
  } catch (error) {
    next(error);
  }
});

const usersRouter = require('../users/controllers');
app.use('/api/users', usersRouter);

const errorHandler = require('../middlewares/error-handler');
app.use(errorHandler);

module.exports = app;
