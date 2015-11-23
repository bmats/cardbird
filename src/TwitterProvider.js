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

  getFeed(maxId = 0, count = 50) {
    return new Promise((resolve, reject) => {
      let endpoint = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + count;
      if (maxId) endpoint += '&max_id=' + maxId;
      this._oauthResult.get(endpoint).done(resolve).fail(e => {
        console.error(e);
        reject(e);
      });
    });
  }
}
