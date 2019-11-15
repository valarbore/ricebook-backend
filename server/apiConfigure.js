const auth = require('./controller/auth');
const profile = require('./controller/profile');
const article = require('./controller/article');
const following = require('./controller/following');
module.exports = app => {
  // auth
  app.post('/register', auth.register);
  app.post('/login', auth.login);
  app.get('/auth', auth.auth);
  app.put('/logout', auth.logout);
  // article
  app.post('/article', article.postArticle);
  app.get('/article/:id?', article.getArticle);
  app.put('/article/:id', article.putArticle);
  //folowing
  app.get('/following/:user?', following.getFollowing);
  app.put('/following/:user', following.putFollowing);
  app.delete('/following/:user', following.deleteFollowing);
  // profile
  app.get('/headline/:user', profile.getHeadline);
  app.put('/headline', profile.putHeadline);
  app.get('/email/:user?', profile.getEmail);
  app.put('/email', profile.putEmail);
  app.get('/zipcode/:user?', profile.getZipcode);
  app.put('/zipcode', profile.putZipcode);
  app.get('/dob/:user?', profile.getDob);
  app.get('/avatar/:user?', profile.getAvatar);
  app.put('/avatar', profile.putAvatar);
  app.put('/password', profile.putPassword);
};
