import _ from 'lodash';

const VISIBLE_CARDS = 6; // > 4
const CARD_DISTANCE = 15;

export default class Cardboard {
  constructor() {
    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setClearColor(0x66ccff, 1);
    this._renderer.setPixelRatio(window.devicePixelRatio);

    let element = this._renderer.domElement;
    this._container = document.querySelector('#container');
    this._container.appendChild(element);

    this._effect = new THREE.StereoEffect(this._renderer);

    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
    this._scene.add(this._camera);

    this._controls = new THREE.OrbitControls(this._camera, element);
    // this._controls.rotateUp(Math.PI / 4);
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

    let texture = new THREE.Texture();
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
    let loader = new THREE.ImageLoader();
    loader.crossOrigin = '';
    loader.load('textures/patterns/checker.png', image => {
      texture.image = image;
      texture.needsUpdate = true;
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

    this._scrollPos = 0;
    this._lastSector = (VISIBLE_CARDS / 2) | 0;
  }

  update(dt) {
    // this.resize();
    this._camera.updateProjectionMatrix();
    let cameraDirection = this._camera.getWorldDirection();
    let cameraAngle = Math.atan2(cameraDirection.z, cameraDirection.x) + Math.PI;

    // Update scroll pos
    let sector = cameraAngle / (Math.PI * 2 / VISIBLE_CARDS);
    if ((sector | 0) !== (this._lastSector | 0)) {
      if (this._lastSector > VISIBLE_CARDS - 2 && sector < 1) {
        this._lastSector -= VISIBLE_CARDS + 1;
      } else if (this._lastSector < 1 && sector > VISIBLE_CARDS - 2) {
        this._lastSector += VISIBLE_CARDS;
      }

      this._scrollPos += (sector | 0) - (this._lastSector | 0);
      this._lastSector = sector;

      console.log('scroll pos', this._scrollPos);
      if (this._cards) {
        this._updateCards();
      }
    }

    this._controls.update(dt);
  }

  // render(dt) {
  //
  // }

  animate(t) {
    requestAnimationFrame(this.animate.bind(this));

    this.update(this._clock.getDelta());

    // _.forEach(this._cards, val => val.mesh.rotation.add());

    this._effect.render(this._scene, this._camera);
    // this.render(this._clock.getDelta());
  }

  get cards() {
    return this._cards;
  }

  set cards(cards) {
    this._cards = cards;
    console.log('got cards', cards.length);

    _.forEach(this._cards, card => {
      card.sectorIndex = undefined;
      card.hide();
      this._scene.add(card.mesh);
    });

    this._updateCards();
  }

  _updateCards() {
    _.forEach(this._cards, card => card.hide());

    let i = this._scrollPos - Math.floor(VISIBLE_CARDS / 2);//(this._scrollPos % VISIBLE_CARDS);\
    let max = this._scrollPos + (VISIBLE_CARDS - Math.floor(VISIBLE_CARDS / 2));// - (this._scrollPos % VISIBLE_CARDS)
    i   = Math.min(Math.max(i, 0), this._cards.length);
    max = Math.min(Math.max(max, 0), this._cards.length);

    for (; i < max; ++i) {
      let card = this._cards[i];
      card.show();
      card.sectorIndex = i % VISIBLE_CARDS;

      let angle = card.sectorIndex * Math.PI * 2 / VISIBLE_CARDS;
      card.mesh.position.set(Math.cos(angle) * CARD_DISTANCE, 0, Math.sin(angle) * CARD_DISTANCE);
      card.mesh.rotation.set(0, -angle, 0);
    }
  }
}
