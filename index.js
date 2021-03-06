const express = require('express');
if (process.env.NODE_ENV === 'development') {
  require('dotenv').config();
}

const middlewareConfigure = require('./server/middlewareConfigure');

// connect to db
require('./server/db');
// config cloudinary
require('./server/cloudinary');

const app = express();
middlewareConfigure(app);
require('./server/controller/auth')(app);
require('./server/controller/article')(app);
require('./server/controller/profile')(app);
require('./server/controller/following')(app);

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const addr = server.address();
  console.log(`Server listening at http://${addr.address}:${addr.port}`);
});
