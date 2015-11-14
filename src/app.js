import _ from 'lodash';
import Cardboard from './Cardboard';
import TwitterCard from './TwitterCard';
import TwitterProvider from './TwitterProvider';

// let container = document.getElementById('container');
// container.addEventListener('click', () => {
//   if (container.requestFullscreen) {
//     container.requestFullscreen();
//   } else if (container.msRequestFullscreen) {
//     container.msRequestFullscreen();
//   } else if (container.mozRequestFullScreen) {
//     container.mozRequestFullScreen();
//   } else if (container.webkitRequestFullscreen) {
//     container.webkitRequestFullscreen();
//   }
// }, false);

// let twitter = new TwitterProvider();
// twitter.connect()
//   .then(() => twitter.getFeed())
//   .then(data => console.log('data', data))
//   .catch(e => alert('Error: ' + e));

var home = [
];

for (var i = 0; i < 10; ++i) {
  home[i] = {
    text: 'This is text #' + i,
    user: {
      name: 'Bryce',
      screen_name: 'binarycaveman',
      profile_image_url_https: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_0_bigger.png'
    }
  };
}

var cards = _.map(home, tweet => new TwitterCard(tweet));

var c = new Cardboard();
c.cards = cards;
c.animate();
