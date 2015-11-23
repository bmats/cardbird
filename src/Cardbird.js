import _ from 'lodash';
import events from 'events';
import TWEEN from 'tween.js';

const VISIBLE_CARDS = 7; // > 4
const CARD_DISTANCE = 15;

class Cardbird extends events.EventEmitter {
  constructor() {
    super();

    this._renderer = new THREE.WebGLRenderer();
    this._renderer.setClearColor(0xffffff, 1);
    this._renderer.setPixelRatio(window.devicePixelRatio);

    let element = this._renderer.domElement;
    this._container = document.querySelector('#container');
    this._container.appendChild(element);

    this._effect = new THREE.StereoEffect(this._renderer);

    this._scene = new THREE.Scene();

    this._camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
    this._scene.add(this._camera);

    this._raycaster = new THREE.Raycaster();

    this._controls = new THREE.OrbitControls(this._camera, element);
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

    window.addEventListener('touchstart', () => self._touching = true);
    window.addEventListener('touchend', () => self._touching = false);

    // let light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
    // this._scene.add(light);

    let texture = new THREE.Texture();
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat = new THREE.Vector2(50, 50);
    texture.anisotropy = this._renderer.getMaxAnisotropy();

    THREE.ImageUtils.crossOrigin = '';

    // let material = new THREE.MeshPhongMaterial({
    //   // color: 0xffffff,
    //   // specular: 0xffffff,
    //   shininess: 0,
    //   shading: THREE.FlatShading,
    //   map: texture
    // });
    // let loader = new THREE.ImageLoader();
    // loader.crossOrigin = '';
    // loader.load('textures/patterns/checker.png', image => {
    //   texture.image = image;
    //   texture.needsUpdate = true;
    // });
    // let geometry = new THREE.PlaneGeometry(1000, 1000);
    // let mesh = new THREE.Mesh(geometry, material);
    // mesh.position.y = -10;
    // mesh.rotation.x = -Math.PI / 2;
    // this._scene.add(mesh);

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

    this._cards = [];
    this._interactables = [];

    this._scrollPos = 0;
    this._lastSector = (VISIBLE_CARDS / 2) | 0;
    this._reachedEnd = false;

    this._buildBackground();
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

    if (this._interactables) {
      this._raycaster.set(this._camera.position, this._camera.getWorldDirection());
      let intersects = this._raycaster.intersectObjects(this._interactables);
      if (intersects.length > 0) {
        let object = intersects[0].object;
        if (object !== this._lastIntersection) {
          if (object.onGaze) object.onGaze();
          this._lastIntersection = object;
        }

        if (this._touching) {
          if (object.onInteract) object.onInteract();
          this._touching = false;
        }
      } else {
        if (this._lastIntersection) this._lastIntersection.onUngaze();
        this._lastIntersection = null;
      }
    }

    this._controls.update(dt);
  }

  animate(t) {
    requestAnimationFrame(this.animate.bind(this));

    this.update(this._clock.getDelta());
    TWEEN.update();

    this._effect.render(this._scene, this._camera);
  }

  get cards() {
    return this._cards;
  }

  set cards(cards) {
    this._cards = cards;

    _.forEach(this._cards, card => {
      if (card.added) return;

      card.sectorIndex = undefined;
      card.hide();
      this._scene.add(card.mesh);
      Array.prototype.push.apply(this._interactables, card.interactables);
      card.added = true;
    });

    this._updateCards();
  }

  _updateCards() {
    let min = this._scrollPos - Math.floor(VISIBLE_CARDS / 2);
    let max = this._scrollPos + (VISIBLE_CARDS - Math.floor(VISIBLE_CARDS / 2));
    min = Math.min(Math.max(min, 0), this._cards.length);
    max = Math.min(Math.max(max, 0), this._cards.length);

    // Hide other cards
    for (let i = 0; i < min; ++i)
      this._cards[i].hide();
    for (let i = max, len = this._cards.length; i < len; ++i)
      this._cards[i].hide();

    for (let i = min; i < max; ++i) {
      let card = this._cards[i];
      card.show();
      card.sectorIndex = i % VISIBLE_CARDS;

      let angle = card.sectorIndex * Math.PI * 2 / VISIBLE_CARDS;
      card.mesh.position.set(Math.cos(angle) * CARD_DISTANCE, 0, Math.sin(angle) * CARD_DISTANCE);
      card.mesh.rotation.set(0, -angle, 0);
    }

    // Send end event if we reached the end
    let atEnd = this._scrollPos > this._cards.length - VISIBLE_CARDS;
    if (atEnd && !this._reachedEnd) {
      this.emit('end');
    }
    this._reachedEnd = atEnd;
  }

  _buildBackground() {
    let icoGeom = new THREE.IcosahedronGeometry(30, 1);
    // Harden normals
    _.forEach(icoGeom.faces, face => {
      face.normal = new THREE.Vector3().crossVectors(
        new THREE.Vector3().subVectors(icoGeom.vertices[face.b], icoGeom.vertices[face.a]),
        new THREE.Vector3().subVectors(icoGeom.vertices[face.c], icoGeom.vertices[face.b])
      );
      face.vertexNormals[0] = face.normal;
      face.vertexNormals[1] = face.normal;
      face.vertexNormals[2] = face.normal;
    });
    icoGeom.normalsNeedUpdate = true;

    let ico = new THREE.Mesh(icoGeom, new THREE.MeshPhongMaterial({
      color: 0x156289,
      emissive: 0x072534,
      side: THREE.BackSide
    }));
    ico.rotation.set(0.5, 0.6, 0.7); // randomy triangles
    this._scene.add(ico);

    // From demo
    var lights = [
      new THREE.PointLight(0xffffff, 1, 0),
      new THREE.PointLight(0xffffff, 1, 0),
      new THREE.PointLight(0xffffff, 1, 0)
    ];
    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(-100, -200, -100);
    this._scene.add(lights[0]);
    this._scene.add(lights[1]);
    this._scene.add(lights[2]);
  }
}

export default Cardbird;
