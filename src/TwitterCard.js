const CANVAS_DENSITY = 50;

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

    this._makeMesh();
  }

  _makeMesh() {
    let backPlane = makePlane(10, 9, {
      color: 0xffffff
    });
    backPlane.rotation.y = -Math.PI * 0.5;

    // Top profile plane
    let userPlane = makePlane(10, 2, {
      color: this.profileBackground
    });
    userPlane.rotation.set(0, -Math.PI * 0.5, 0);
    userPlane.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0)));
    userPlane.position.set(0, 6, 0);

    let userImagePlane = makePlane(2.5, 2.5, {
      map: THREE.ImageUtils.loadTexture(this.userImage)
    });
    userImagePlane.matrixAutoUpdate = false;
    userImagePlane.matrix
      .multiply(new THREE.Matrix4().makeTranslation(-3, 0.5, 0.6));
    userPlane.add(userImagePlane);

    let userTextPlane = makePlane(6, 2, {
      map: renderCanvas((canvas, ctx) => {
        canvas.width = 5 * CANVAS_DENSITY;
        canvas.height = 2 * CANVAS_DENSITY;

        ctx.font = 'bold 30px Arial';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#' + this.profileForeground.toString(16);
        ctx.fillText(this.userName, 0, 15);

        ctx.font = '25px Arial';
        ctx.fillText('@' + this.userHandle, 0, 55);
      }),
      transparent: true
    });
    userTextPlane.matrixAutoUpdate = false;
    userTextPlane.matrix
      .multiply(new THREE.Matrix4().makeTranslation(1.75, 0, 0.4));
    userPlane.add(userTextPlane);

    // Tweet text
    let textPlane = makePlane(9, 9, {
      map: renderCanvas((canvas, ctx) => {
        canvas.width = 9 * CANVAS_DENSITY;
        canvas.height = 9 * CANVAS_DENSITY;

        ctx.font = '20px Arial';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#222';
        wrapText(ctx, this.text, 20, 50, canvas.width - 40, 27);
      }),
      transparent: true
    });
    textPlane.position.z = 1;
    backPlane.add(textPlane);

    this._mesh = new THREE.Object3D();
    this._mesh.add(userPlane);
    this._mesh.add(backPlane);
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
