/**
 * configure middleware
 */
const bodyParser = require('body-parser');
const cors = require('cors');
const cookies = require('cookie-parser');
const url =
  process.env.NODE_ENV === 'production'
    ? 'http://ricebook.bozhang.bz31.surge.sh'
    : 'http://localhost:3000';
module.exports = app => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookies());
  app.use(cors({ credentials: true, origin: url }));
};
