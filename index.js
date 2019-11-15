require('babel-register');
const express = require('express');
const apiConfigure = require('./server/apiConfigure');
const middlewareConfigure = require('./server/middlewareConfigure');
// connect to db
require('./server/db');
// config cloudinary
require('./server/cloudinary');

const app = express();
middlewareConfigure(app);
apiConfigure(app);
// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  const addr = server.address();
  console.log(`Server listening at http://${addr.address}:${addr.port}`);
});
