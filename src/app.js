import _ from 'lodash';
import Cardbird from './Cardbird';
import TwitterCard from './TwitterCard';
import TwitterProvider from './TwitterProvider';

let container = document.getElementById('container');
let isFullscreen = false;
container.addEventListener('touchend', () => {
  if (isFullscreen) {
    window.location.reload(); // TEMP: for debugging
    return;
  }

  isFullscreen = true;
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
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
