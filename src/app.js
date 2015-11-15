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
twitter.connect()
  .then(() => twitter.getFeed())
  .then(home => {
    let cards = _.map(home, tweet => new TwitterCard(tweet));
    demo.cards = cards;
  })
  .catch(e => console.error('Error: ' + e));
