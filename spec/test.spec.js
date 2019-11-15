/* eslint-disable no-undef */
/*
 * Test suite for articles
 */
require('es6-promise').polyfill();
require('isomorphic-fetch');
var FormData = require('form-data');
const url = path => `http://localhost:8080${path}`;
let cookies;
describe('Validate Headline functionality', () => {
  it('should log in with correct username and password', done => {
    fetch(url('/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test_wrong', password: '123_wrong' }),
    })
      .then(res => {
        return res.json();
      })
      .then(res => {
        expect(res.code).toBe(101);
        done();
      });
  });
  it('should log in with correct username and password', done => {
    fetch(url('/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test', password: '123' }),
    })
      .then(res => {
        cookies = res.headers._headers['set-cookie'];
        return res.json();
      })
      .then(res => {
        expect(res.code).toBe(0);
        done();
      });
  });
});

describe('Validate Headline functionality', () => {
  it('Get headline', done => {
    fetch(url('/headline/test'), {
      method: 'Get',
      headers: { cookie: cookies },
    })
      .then(res => {
        return res.json();
      })
      .then(res => {
        expect(res.code).toBe(0);
        expect(res.data).toBe('headline');
        done();
      });
  });
  it('Put headline', done => {
    fetch(url('/headline'), {
      method: 'PUT',
      headers: { cookie: cookies, 'Content-Type': 'application/json' },
      body: JSON.stringify({ headline: 'new headline' }),
    })
      .then(res => {
        return res.json();
      })
      .then(res => {
        expect(res.code).toBe(0);
        expect(res.data).toBe('new headline');
        done();
      });
  });
});

describe('Validate Article functionality', () => {
  it('should give me five or more articles', done => {
    fetch(url('/article'), {
      method: 'GET',
      headers: { cookie: cookies },
    })
      .then(res => res.json())
      .then(res => {
        expect(res.code).toBe(0);
        if (res.data instanceof Array)
          expect(res.data.length).toBeGreaterThan(4);
        done();
      });
  });

  it('should give me articles with id 5dcdf6a9b5cace83290dcca5', done => {
    fetch(url('/article/5dcdf6a9b5cace83290dcca5'), {
      method: 'GET',
      headers: { cookie: cookies },
    })
      .then(res => res.json())
      .then(res => {
        expect(res.code).toBe(0);
        expect(res.data._id).toBe('5dcdf6a9b5cace83290dcca5');
        done();
      });
  });

  it('should give me articles with author test', done => {
    fetch(url('/article/test'), {
      method: 'GET',
      headers: { cookie: cookies },
    })
      .then(res => res.json())
      .then(res => {
        expect(res.code).toBe(0);
        res.data.forEach(article => expect(article.author).toBe('test'));
        done();
      });
  });

  it('should add new article return the new article', done => {
    const formData = new FormData();
    formData.append('head', 'new article');
    formData.append('text', 'new article content');
    fetch(url('/article'), {
      method: 'POST',
      headers: { cookie: cookies },
      body: formData,
    })
      .then(res => res.json())
      .then(res => {
        expect(res.code).toBe(0);
        expect(res.data.head).toBe('new article');
        expect(res.data.text).toBe('new article content');
        done();
      });
  });
});

describe('Validate Logout functionality', () => {
  it('should log out', done => {
    fetch(url('/logout'), {
      method: 'PUT',
      headers: { cookie: cookies },
    })
      .then(res => {
        return res.json();
      })
      .then(res => {
        expect(res.code).toBe(0);
        done();
      });
  });
});
