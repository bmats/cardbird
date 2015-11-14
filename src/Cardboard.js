export default class Cardboard {
  constructor() {
    this._renderer = new THREE.WebGLRenderer();
    let element = this._renderer.domElement;
    this._container = document.querySelector('#container');
    this._container.appendChild(element);

    this._effect = new THREE.StereoEffect(this._renderer);

    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
    this._scene.add(this._camera);

    this._controls = new THREE.OrbitControls(this._camera, element);
    this._controls.rotateUp(Math.PI / 4);
    this._controls.target.set(
      this._camera.position.x + 0.1,
      this._camera.position.y,
      this._camera.position.z
    );
    this._controls.noZoom = true;
    this._controls.noPan = true;

    this._clock = new THREE.Clock();

    const self = this;

    function setOrientationControls(e) {
      if (!e.alpha) {
        return;
      }

      self._controls = new THREE.DeviceOrientationControls(self._camera, true);
      self._controls.connect();
      self._controls.update();

      window.removeEventListener('deviceorientation', setOrientationControls, true);
    }
    window.addEventListener('deviceorientation', setOrientationControls, true);


    let light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
    this._scene.add(light);

    let texture = THREE.ImageUtils.loadTexture(
      'textures/patterns/checker.png'
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(50, 50);
    texture.anisotropy = this._renderer.getMaxAnisotropy();

    let material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0xffffff,
      shininess: 20,
      shading: THREE.FlatShading,
      map: texture
    });

    let geometry = new THREE.PlaneGeometry(1000, 1000);

    let mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = -10;
    mesh.rotation.x = -Math.PI / 2;
    this._scene.add(mesh);

    function resize() {
      const width  = self._container.offsetWidth;
      const height = self._container.offsetHeight;

      self._camera.aspect = width / height;
      self._camera.updateProjectionMatrix();

      self._renderer.setSize(width, height);
      self._effect.setSize(width, height);
    }
    window.addEventListener('resize', resize, false);
    setTimeout(resize, 1);
  }

  set(cards) {
    for (let i in cards) {
      let card = cards[i];
      let mesh = card.makeMesh();
      // mesh.position.y = 10;
      mesh.position.x = 10;
      this._scene.add(mesh);
    }
  }

  update(dt) {
    // this.resize();

    this._camera.updateProjectionMatrix();

    this._controls.update(dt);
  }

  render(dt) {
    this._effect.render(this._scene, this._camera);
  }

  animate(t) {
    requestAnimationFrame(this.animate.bind(this));

    this.update(this._clock.getDelta());
    this.render(this._clock.getDelta());
  }
}
