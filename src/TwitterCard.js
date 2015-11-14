function renderCanvas(graphicsCb) {
  let renderCanvasBitmap = document.createElement('canvas');

  let ctx = renderCanvasBitmap.getContext('2d');
  graphicsCb(renderCanvasBitmap, ctx);

  let texture = new THREE.Texture(renderCanvasBitmap);
  texture.needsUpdate = true;
  return texture;
}

function makePlane(width = 10, height = 10, matOptions = {}) {
  let geom = new THREE.PlaneGeometry(width, height);
  let mat = new THREE.MeshBasicMaterial(matOptions);
  let plane = new THREE.Mesh(geom, mat);
  return plane;
}

export default class TwitterCard {
  constructor(tweet) {
    this._text = tweet.text;
    this._userName = tweet.user.name;
    this._userImage = tweet.user.profile_image_url_https;
    this._userHandle = tweet.user.screen_name;

    this._makeMesh();
  }

  _makeMesh() {
    let backPlane = makePlane(10, 10, {
      color: 0xff0000 // TODO: user profile color
    });
    backPlane.rotation.y = -Math.PI * 0.5;

    let textPlane = makePlane(10, 10, {
      color: 0xffffff,
      map: renderCanvas((bitmap, ctx) => {
        bitmap.width = 512;
        bitmap.height = 512;

        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(this._text, 20, 50);
      }),
      transparent: true
    });
    textPlane.position.z = 0.2;
    backPlane.add(textPlane);
    textPlane.applyMatrix(backPlane.matrixWorld);

    let profilePlane = makePlane(3, 3, {
      map: THREE.ImageUtils.loadTexture(this._userImage)
    });
    profilePlane.position.set(8, 0, 0.8);
    backPlane.add(profilePlane);
    profilePlane.applyMatrix(backPlane.matrixWorld);

    this._mesh = new THREE.Object3D();
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
