var fs = require('fs');

fs.readFile('profile.json', function(err, data) {
  console.log('Reading from profile file');
  fs.readFile('follower.json', function(err, data) {
    console.log('Reading from followers file');
  });
  console.log('done with profile file');
});

fs.readFile('articles.json', function(err, data) {
  console.log('Reading from articles file');
});

console.log('last statement in program');
