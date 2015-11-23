export default class TwitterProvider {
  constructor() {
    OAuth.initialize('VF27HM_okjGLNQHA3wQsyyUCfKc');
  }

  connect() {
    return new Promise((resolve, reject) => {
      OAuth.popup('twitter').done(result => {
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
