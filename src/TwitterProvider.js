import url from 'url';
import {getQueryVariable} from './util';

export default class TwitterProvider {
  constructor() {
    // this._token       = window.localStorage.getItem('twitter_token');
    // this._tokenSecret = window.localStorage.getItem('twitter_token_secret');
    OAuth.initialize('VF27HM_okjGLNQHA3wQsyyUCfKc');
  }

  connect() {
    return new Promise((resolve, reject) => {
      // if (this._token) {
      //   resolve();
      //   return;
      // }

      OAuth.popup('twitter').done(result => {
        // this._token = result.oauth_token;
        // this._tokenSecret = result.oauth_token_secret;
        // window.localStorage.setItem('twitter_token', result.oauth_token);
        // window.localStorage.setItem('twitter_token_secret', result.oauth_token_secret);
        this._oauthResult = result;
        resolve();
      });
    });
  }

  getFeed(count = 50) {
    return new Promise((resolve, reject) => {
      this._oauthResult.get('https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + count).done(resolve).fail(e => {
        console.error(e);
        reject(e);
      });
    });
  }
}
