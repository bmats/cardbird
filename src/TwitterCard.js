import _ from 'lodash';
import url from 'url';

const CANVAS_DENSITY = 50;

function getProxiedImageSrc(src, width = 256, height = 256) {
  var urlObj = url.parse(src);
  var queryStr = '';
  if (width > 0) queryStr += '&width=' + width;
  if (height > 0) queryStr += '&height=' + height;
  return 'http://' + urlObj.hostname + '.rsz.io' + urlObj.path + '?format=png&colorspace=rgb' + queryStr;
}

function renderCanvas(graphicsCb) {
  let canvas = document.createElement('canvas');

  let ctx = canvas.getContext('2d');
  graphicsCb(canvas, ctx);

  let texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function makePlane(width = 10, height = 10, matOptions = {}) {
  let geom = new THREE.PlaneGeometry(width, height);
  let mat = new THREE.MeshBasicMaterial(matOptions);
  let plane = new THREE.Mesh(geom, mat);
  return plane;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  var words = text.split(' ');
  var line = '';

  for(var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + ' ';
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    }
    else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

const loader = new THREE.TextureLoader();

export default class TwitterCard {
  constructor(tweet) {
    this.text = tweet.text;
    this.userName = tweet.user.name;
    this.userImage = tweet.user.profile_image_url_https.replace('_normal.', '_bigger.');
    this.userHandle = tweet.user.screen_name;
    this.profileForeground = parseInt(tweet.user.profile_text_color, 16);
    this.profileBackground = parseInt(tweet.user.profile_background_color, 16);
    this.linkColor = parseInt(tweet.user.profile_link_color, 16);
    this.retweets = tweet.retweeted_status ? tweet.retweeted_status.retweet_count : tweet.retweet_count;
    this.favorites = tweet.retweeted_status ? tweet.retweeted_status.favorite_count : tweet.favorite_count;

    this.media = _(tweet.entities.media).filter(media => media.type === 'photo').map(media => media.media_url).value();

    this._makeMesh();
  }

  _makeMesh() {
    this._mesh = new THREE.Object3D();

    let backPlane = makePlane(10, 5, {
      color: 0xffffff
    });
    backPlane.rotation.y = -Math.PI * 0.5;

    // Top profile plane
    let userPlane = makePlane(10, 2, {
      color: this.profileBackground
    });
    userPlane.rotation.set(0, -Math.PI * 0.5, 0);
    userPlane.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0)));
    userPlane.position.set(0, 4, 0);

    // let userImageTexture = new THREE.Texture();
    let userImagePlane = makePlane(2.5, 2.5, {
      map: THREE.ImageUtils.loadTexture('textures/default.png')
    });
    // loader.load('textures/default.png', image => { // getProxiedImageSrc(this.userImage, 64, 64)
    //   userImageTexture.image = image;
    //   userImageTexture.needsUpdate = true;
    // });
    userImagePlane.matrixAutoUpdate = false;
    userImagePlane.matrix
      .multiply(new THREE.Matrix4().makeTranslation(-3, 0.5, 0.5));
    userPlane.add(userImagePlane);

    let userTextPlane = makePlane(6, 2, {
      map: renderCanvas((canvas, ctx) => {
        canvas.width = 5 * CANVAS_DENSITY;
        canvas.height = 2 * CANVAS_DENSITY;

        ctx.font = 'bold 30px Roboto';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#' + this.profileForeground.toString(16);
        ctx.fillText(this.userName, 0, 15);

        ctx.font = '25px Roboto';
        ctx.fillText('@' + this.userHandle, 0, 55);
      }),
      transparent: true
    });
    userTextPlane.matrixAutoUpdate = false;
    userTextPlane.matrix
      .multiply(new THREE.Matrix4().makeTranslation(1.75, 0, 0.4));
    userPlane.add(userTextPlane);

    let retweets = this._makeIconPlane('textures/retweet.png', this.retweets);
    retweets.position.set(-1.8, -1.8, 0.5);
    retweets.rotation.set(-0.2, 0.1, 0);
    let favorites = this._makeIconPlane('textures/favorite.png', this.favorites);
    favorites.position.set(1.8, -1.8, 0.5);
    favorites.rotation.set(-0.2, -0.1, 0);

    backPlane.add(retweets);
    backPlane.add(favorites);

    // Tweet text
    let textPlane = makePlane(9, 5, {
      map: renderCanvas((canvas, ctx) => {
        canvas.width = 9 * CANVAS_DENSITY;
        canvas.height = 5 * CANVAS_DENSITY;

        ctx.font = '20px Roboto';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#222';
        wrapText(ctx, this.text, 20, 50, canvas.width - 40, 27);
      }),
      transparent: true
    });
    textPlane.position.z = 0.2;
    backPlane.add(textPlane);

    if (this.media.length > 0) {
      let imageTexture = new THREE.Texture();
      let imagePlane = makePlane(4, 4, {
        color: 0xff0000,
        map: imageTexture
      });
      loader.load(getProxiedImageSrc(this.media[0]), image => {
        console.log(getProxiedImageSrc(this.media[0]));
        imageTexture.image = image;
        imageTexture.needsUpdate = true;
      });
      imagePlane.position.z = 0.5;
      backPlane.add(imagePlane);
    }

    this._mesh.add(userPlane);
    this._mesh.add(backPlane);
  }

  _makeIconPlane(iconSrc, text) {
    let button = makePlane(1.5, 0.9, {
      color: 0x000000,
      opacity: 0.1,
      transparent: true
    });
    button.onIntersect = () => {
      console.log('intersect!');
    };
    button.onInteract = () => {
      console.log('interacted!');
    };

    let iconPlane = makePlane(0.6, 0.6, {
      map: THREE.ImageUtils.loadTexture(iconSrc),
      transparent: true
    });
    iconPlane.position.set(-0.3, 0, 0.1);

    let textPlane = makePlane(0.7, 0.4, {
      map: renderCanvas((canvas, ctx) => {
        canvas.width = 0.7 * CANVAS_DENSITY;
        canvas.height = 0.4 * CANVAS_DENSITY;

        ctx.font = '20px Roboto';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.retweets.toString(), canvas.width * 0.5, canvas.height * 0.5);
      }),
      transparent: true
    });
    textPlane.position.set(0.35, 0, 0.1);

    button.add(iconPlane);
    button.add(textPlane);
    return button;
  }

  show() {
    // THREE.SceneUtils.traverseHierarchy(this._mesh, obj => obj.visible = true);
    this._mesh.position.y = 0;
  }

  hide() {
    // THREE.SceneUtils.traverseHierarchy(this._mesh, obj => obj.visible = false);
    this._mesh.position.y = -10000; // lol
  }

  get mesh() {
    return this._mesh;
  }
}
