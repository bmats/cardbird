var renderCanvasBitmap;
function renderCanvas(graphicsCb) {
  if (!renderCanvasBitmap) {
    renderCanvasBitmap = document.createElement('canvas');
  }

  var g = renderCanvasBitmap.getContext('2d');
  graphicsCb(renderCanvasBitmap, g);

  return new THREE.Texture(renderCanvasBitmap);
}

export default class TwitterCard {
  constructor(tweet) {
    this._text = tweet.text;
    this._userName = tweet.user.name;
    this._userImage = tweet.user.profile_image_url_https;
    this._userHandle = tweet.user.screen_name;
  }

  makeMesh() {
    let backPlaneGeom = new THREE.PlaneGeometry(10, 10);
    let backPlaneMat = new THREE.MeshLambertMaterial({
      color: 0xff0000 // TODO: user profile color
    });
    let backPlane = new THREE.Mesh(backPlaneGeom, backPlaneMat);
    backPlane.rotation.y = -Math.PI * 0.5;

    let textPlaneGeom = new THREE.PlaneGeometry(10, 10);
    let textPlaneMat = new THREE.MeshBasicMaterial({
      map: renderCanvas((bitmap, g) => {
        bitmap.width = 100;
        bitmap.height = 100;
        g.font = 'bold 20px Arial';

        g.fillStyle = 'white';
        g.fillText(this._text, 0, 20);
      })
    });
    let textPlane = new THREE.Mesh(textPlaneGeom, textPlaneMat);
    textPlane.position.z = -0.1;
    backPlane.add(textPlane);

    return backPlane;
  }
}
