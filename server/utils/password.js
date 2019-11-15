let md5 = require('js-md5');
function encodePassword(password, salt) {
  if (salt === null) {
    const time = new Date().toString();
    salt = time + 'bz31';
  }
  const encodedPass = md5(password + salt);
  return {
    salt,
    encodedPass,
  };
}

module.exports = { encodePassword };
