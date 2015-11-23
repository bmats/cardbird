import _ from 'lodash';
import Cardbird from './Cardbird';
import TwitterCard from './TwitterCard';
import TwitterProvider from './TwitterProvider';

document.body.addEventListener('touchend', () => {
  if (document.body.requestFullscreen) {
    document.body.requestFullscreen();
  } else if (document.body.msRequestFullscreen) {
    document.body.msRequestFullscreen();
  } else if (document.body.mozRequestFullScreen) {
    document.body.mozRequestFullScreen();
  } else if (document.body.webkitRequestFullscreen) {
    document.body.webkitRequestFullscreen();
  }
}, false);

var demo = new Cardbird();
demo.animate();

// var home = [];
// for (var i = 0; i < 10; ++i) {
//   home[i] = {
//     text: 'This is text #' + i,
//     user: {
//       name: 'Bryce',
//       screen_name: 'binarycaveman',
//       profile_image_url_https: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_0_bigger.png'
//     }
//   };
// }
// demo.cards = home;

let twitter = new TwitterProvider();
let lastId = 0;
twitter.connect()
  .then(() => console.log('Authenticated with Twitter'))
  .then(() => twitter.getFeed())
  .then(home => {
    console.log('Got home timeline with ' + home.length + ' items');
    let cards = _.map(home, tweet => new TwitterCard(tweet));
    demo.cards = cards;
    lastId = _.last(home).id;
  })
  .catch(e => {
    console.error(e);
    alert('Error: ' + e.statusText);
  });

demo.on('end', () => {
  console.log('Requesting more cards...');
  twitter.getFeed(lastId)
    .then(home => {
      console.log('Got new home timeline with ' + home.length + ' items');

      // Add more cards to end of array
      let newCards = _.map(home, tweet => new TwitterCard(tweet));
      let cards = demo.cards;
      Array.prototype.push.apply(cards, newCards);
      demo.cards = cards;
      lastId = _.last(home).id;
    })
    .catch(e => {
      console.error(e);
      alert('Error: ' + e.statusText);
    });
});
