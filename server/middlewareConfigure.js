/**
 * configure middleware
 */
const bodyParser = require('body-parser');
const cors = require('cors');
const cookies = require('cookie-parser');
const auth = require('./controller/auth');
module.exports = app => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cookies());
  app.use(cors({ credentials: true, origin: 'ricebook.bz31.surge.sh' }));
  app.use(auth.isLoggedIn);
};
