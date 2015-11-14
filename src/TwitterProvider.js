import {OAuth} from 'oauth';
import url from 'url';
import {getQueryVariable} from './util';

const REQUEST_URL = 'https://api.twitter.com/oauth/request_token';
const ACCESS_URL = 'https://api.twitter.com/oauth/access_token';
const CLIENT_KEY = 'dnMqzbRnIpwNCDJwi7QHhnEA7';
const CLIENT_SECRET = 'Vx8pGIGW1leTBwq4FBsvasQuMDnkNfOtLWF5TouTNGoSNlgAyM';

export default class TwitterProvider {
  constructor() {
    this._token       = window.localStorage.getItem('twitter_token');
    this._tokenSecret = window.localStorage.getItem('twitter_token_secret');
    this._oauth = new OAuth(REQUEST_URL, ACCESS_URL, CLIENT_KEY, CLIENT_SECRET, '1.0', window.location.href, 'HMAC-SHA1');
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this._token) {
        resolve();
        return;
      }

      if (!getQueryVariable('callback')) {
        this._oauth.getOAuthRequestToken((e, token, tokenSecret, result) => {
          if (e) {
            console.error('Error when getting request token:', e, result);
            reject(e);
            return;
          }

          let authUrl = 'https://twitter.com/oauth/authenticate?oauth_token=' + token;
          window.location.href = authUrl;
        });
      } else {
        let callbackUrl = url.parse(window.location.href, true);
        this._oauth.getOAuthAccessToken(callbackUrl.query.oauth_token, tokenSecret, callbackUrl.query.oauth_verifier, (e, accessToken, accessTokenSecret, result) => {
          if (e) {
            console.error('Error when getting access token:', e, result);
            reject(e);
            return;
          }

          this._token = accessToken;
          this._tokenSecret = accessTokenSecret;
          window.localStorage.setItem('twitter_token', accessToken);
          window.localStorage.setItem('twitter_token_secret', accessTokenSecret);
          resolve();
        });
      }
    });
  }

  getFeed(count = 30) {
    return new Promise((resolve, reject) => {
      this._oauth.get('https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + count, this._token, this._tokenSecret, (e, data, result) => {
        if (e) {
          console.error('home_timeline error:', e, data, result);
          reject(e);
          return;
        }

        try {
          let json = JSON.parse(data);
          resolve(json);
        } catch (parseError) {
          console.error('JSON parse error:', parseError, data);
          reject(parseError);
        }
      });
    });
  }
}
