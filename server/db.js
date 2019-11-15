var mongoose = require('mongoose');

// replace this "localhost" value with the one from heroku/mlab
var url =
  'mongodb://heroku_k375w6mb:hfpqrlivu5dpaupa459fcepd5g@ds053607.mlab.com:53607/heroku_k375w6mb';

if (process.env.MONGOLAB_URI) {
  url = process.env.MONGOLAB_URI;
}

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

///////////////////////////////////////////////////
mongoose.connection.on('connected', function() {
  console.log('Mongoose connected to ' + url);
});
mongoose.connection.on('error', function(err) {
  console.error('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', function() {
  console.log('Mongoose disconnected');
});

process.once('SIGUSR2', function() {
  shutdown('nodemon restart', function() {
    process.kill(process.pid, 'SIGUSR2');
  });
});
process.on('SIGINT', function() {
  shutdown('app termination', function() {
    process.exit(0);
  });
});
process.on('SIGTERM', function() {
  shutdown('Heroku app shutdown', function() {
    process.exit(0);
  });
});
function shutdown(msg, callback) {
  mongoose.connection.close(function() {
    console.log('Mongoose disconnected through ' + msg);
    callback();
  });
}
///////////////////////////////////////////////////
