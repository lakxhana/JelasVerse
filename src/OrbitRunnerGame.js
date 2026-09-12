import * as THREE from '../vendor/three.module.js';

const ROUTES = [
  {
    name: 'INNER SYSTEM',
    worlds: ['Earth', 'Mercury', 'Venus', 'Mars'],
    target: 'Earth',
    school: 'BLUE HORIZON SCHOOL',
    place: 'Coastal biosphere campus',
    sky: 0x7eafc7,
    ground: 0x5c9675,
    accent: 0x78efc2,
    planet: 0x2f729f,
  },
  {
    name: 'GAS GIANTS',
    worlds: ['Jupiter', 'Saturn'],
    target: 'Jupiter',
    school: 'AURORA COMMONS',
    place: 'Storm-level academy platform',
    sky: 0x3c3b79,
    ground: 0x605083,
    accent: 0xffd877,
    planet: 0xc98654,
  },
  {
    name: 'OUTER ORBIT',
    worlds: ['Uranus', 'Neptune', 'Pluto'],
    target: 'Neptune',
    school: 'FAR HORIZON SCHOOL',
    place: 'Ice-moon research campus',
    sky: 0x23324e,
    ground: 0x8291ad,
    accent: 0xb3a0ff,
    planet: 0x6787d4,
  },
];

const DIALOGUE = [
  ['MAYA', 'FLIGHT COMMANDER', 'That signal again. Just beyond Saturn’s rings. Tell me you’re hearing it too.'],
  ['LEO', 'NAVIGATION SPECIALIST', 'I hear it. A repeating pattern — not a distress call. Someone wants us to follow.'],
  ['MAYA', 'FLIGHT COMMANDER', 'Then let’s find them. Choose a route, keep the ship inside the gates, and watch for ion beams.'],
];

const clamp = THREE.MathUtils.clamp;
const ease = (value) => value * value * (3 - 2 * value);

class InputController {
  constructor() {
    this.actions = new Set();
    this.keyToAction = new Map([
      ['KeyA', 'left'], ['ArrowLeft', 'left'], ['KeyD', 'right'], ['ArrowRight', 'right'],
      ['KeyW', 'up'], ['ArrowUp', 'up'], ['KeyS', 'down'], ['ArrowDown', 'down'],
      ['Space', 'boost'],
    ]);

    window.addEventListener('keydown', (event) => {
      const action = this.keyToAction.get(event.code);
      if (!action) return;
      event.preventDefault();
      this.actions.add(action);
    });
    window.addEventListener('keyup', (event) => {
      const action = this.keyToAction.get(event.code);
      if (action) this.actions.delete(action);
    });
    window.addEventListener('blur', () => this.clear());
  }

  has(action) { return this.actions.has(action); }
  clear() { this.actions.clear(); }
  axis(negative, positive) { return (this.has(positive) ? 1 : 0) - (this.has(negative) ? 1 : 0); }
}

class HUD {
  constructor() {
    this.flight = document.querySelector('#flight-hud');
    this.surface = document.querySelector('#surface-hud');
    this.destination = document.querySelector('#destination');
    this.routeName = document.querySelector('#route-name');
    this.hull = document.querySelector('#hull-meter');
    this.gates = document.querySelector('#gate-count');
    this.range = document.querySelector('#range');
    this.progress = document.querySelector('#progress-meter');
    this.phase = document.querySelector('#surface-phase');
    this.title = document.querySelector('#surface-title');
    this.objective = document.querySelector('#surface-objective');
    this.message = document.querySelector('#surface-message');
    this.controls = document.querySelector('#surface-controls');
    this.toast = document.querySelector('#toast');
    this.toastTimer = 0;
  }

  showFlight(route) {
    this.flight.classList.add('visible');
    this.surface.classList.remove('visible');
    this.destination.textContent = route.target.toUpperCase();
    this.routeName.textContent = `${route.name} / 01 OF ${String(route.worlds.length).padStart(2, '0')}`;
  }

  showSurface(route, phase, objective, message, controls) {
    this.flight.classList.remove('visible');
    this.surface.classList.add('visible');
    this.phase.textContent = phase;
    this.title.textContent = `${route.target} · ${route.school}`;
    this.objective.textContent = objective;
    this.message.textContent = message;
    this.controls.textContent = controls;
  }

  updateFlight(distance, hull, gates, totalGates) {
    this.hull.style.width = `${hull}%`;
    this.gates.textContent = `${gates} / ${totalGates}`;
    this.range.textContent = `${Math.max(0, Math.ceil(620 - distance))} KM`;
    this.progress.style.width = `${clamp(distance / 620, 0, 1) * 100}%`;
  }

  notify(message) {
    this.toast.textContent = message;
    this.toast.classList.add('visible');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('visible'), 2400);
  }
}

class OrbitRunnerGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030913);
    this.scene.fog = new THREE.FogExp2(0x030913, 0.004);
    this.camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 1300);
    this.camera.position.set(0, 2.5, 14);

    this.scene.add(new THREE.HemisphereLight(0xbbeeff, 0x172747, 2.5));
    this.sun = new THREE.DirectionalLight(0xffe6bd, 3.2);
    this.sun.position.set(-40, 60, 25);
    this.scene.add(this.sun);
    this.engineLight = new THREE.PointLight(0x78edff, 10, 35);
    this.engineLight.position.set(0, 0, 4);
    this.scene.add(this.engineLight);

    this.input = new InputController();
    this.hud = new HUD();
    this.setGameState('briefing');
    this.routeIndex = 0;
    this.route = ROUTES[this.routeIndex];
    this.dialogueIndex = 0;
    this.flightDistance = 0;
    this.flightHull = 100;
    this.gatesPassed = 0;
    this.landingElapsed = 0;
    this.lastFrame = performance.now();
    this.cameraTarget = new THREE.Vector3();
    this.clock = new THREE.Clock();

    this.planetTextures = new Map();
    this.textureLoader = new THREE.TextureLoader();
    this.starField = this.createStarField();
    this.bridgeWorld = new THREE.Group();
    this.flightWorld = new THREE.Group();
    this.campusWorld = new THREE.Group();
    this.interiorWorld = new THREE.Group();
    this.ship = this.createRocket();
    this.ship.position.set(0, 0, 2);
    this.scene.add(this.starField, this.bridgeWorld, this.flightWorld, this.campusWorld, this.interiorWorld, this.ship);
    this.createBridge();
    this.ship.visible = false;
    this.campusWorld.visible = false;
    this.interiorWorld.visible = false;

    this.bindUI();
    this.renderRoutes();
    this.updateDialogue();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    requestAnimationFrame((time) => this.frame(time));
  }

  bindUI() {
    const advance = () => this.advanceDialogue();
    document.querySelector('#dialogue-card').addEventListener('click', advance);
    document.querySelector('#dialogue-card').addEventListener('keydown', (event) => {
      if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); advance(); }
    });
    window.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && this.state === 'briefing') { event.preventDefault(); advance(); }
    });
    document.querySelector('#launch').addEventListener('click', () => this.launch());
    document.querySelector('#restart').addEventListener('click', () => this.restart());

    document.querySelectorAll('[data-action]').forEach((button) => {
      const action = button.dataset.action;
      const start = (event) => { event.preventDefault(); this.input.actions.add(action); };
      const stop = (event) => { event.preventDefault(); this.input.actions.delete(action); };
      button.addEventListener('pointerdown', start);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => button.addEventListener(type, stop));
    });
  }

  setGameState(state) {
    this.state = state;
    document.body.dataset.gameState = state;
  }

  createBridge() {
    const world = this.bridgeWorld;
    const material = (color, roughness = .6, metalness = .2) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const dark = material(0x050d14, .5, .48);
    const frame = material(0x0a1c24, .58, .38);
    const floor = material(0x06131c, .82, .2);
    const cyan = new THREE.MeshBasicMaterial({ color: 0x91eff5 });
    const panel = new THREE.MeshStandardMaterial({ color: 0x12607a, emissive: 0x169fc2, emissiveIntensity: 1.35, roughness: .2, metalness: .5 });
    const add = (geometry, mat, x, y, z, parent = world) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const box = (width, height, depth, mat, x, y, z, parent = world) => add(new THREE.BoxGeometry(width, height, depth), mat, x, y, z, parent);

    const deck = add(new THREE.PlaneGeometry(42, 44), floor, 0, 0, -15);
    deck.rotation.x = -Math.PI / 2;
    for (let x = -20; x <= 20; x += 5) box(.035, .02, 42, cyan, x, .015, -15);
    for (let z = 5; z >= -36; z -= 5) box(42, .02, .035, cyan, 0, .015, z);

    const saturn = this.createPlanet(0xc8a16b, 0x77dff5, 21, true, 'Saturn');
    saturn.position.set(11, 14, -74);
    world.add(saturn);
    const windowGlow = new THREE.PointLight(0x6fdbea, 4.4, 85);
    windowGlow.position.set(0, 9, -28);
    world.add(windowGlow);
    const bridgeLight = new THREE.PointLight(0xcffaff, 16, 42);
    bridgeLight.position.set(0, 7, 7);
    world.add(bridgeLight);

    box(42, .75, 1.2, dark, 0, 8.7, -30);
    box(42, .55, 1.2, frame, 0, 1.2, -30);
    [-17, -6.5, 6.5, 17].forEach((x) => {
      box(.85, 9.1, .8, dark, x, 4.8, -30);
      box(.08, 8.3, .06, cyan, x + .3, 4.9, -29.55);
    });
    box(32, .1, .08, cyan, 0, 8.1, -29.5);

    const consolePod = (x, z, rotation) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      group.rotation.y = rotation;
      world.add(group);
      box(9.6, 1.25, 3.2, dark, 0, .65, 0, group);
      const screen = box(7.9, .09, 1.92, panel, 0, 1.35, -.25, group);
      screen.rotation.x = -.29;
      for (let index = -3; index <= 3; index += 1) box(.44, .06, .24, cyan, index * .98, 1.56, -.55, group);
      [-2.8, 0, 2.8].forEach((x) => box(1.35, .04, .26, new THREE.MeshBasicMaterial({ color: 0xf2d27e }), x, 1.58, .05, group));
    };
    consolePod(-14, -13, .2);
    consolePod(14, -13, -.2);
    consolePod(0, -17.5, 0);
    box(11, .8, 2.7, dark, 0, .42, -17.5);
    const hologram = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 2), new THREE.MeshBasicMaterial({ color: 0x9beff5, wireframe: true, transparent: true, opacity: .7 }));
    hologram.position.set(0, 3.05, -17.7);
    world.add(hologram);
    this.bridgeHologram = hologram;
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(1.45, .035, 6, 48), cyan);
    holoRing.position.copy(hologram.position);
    holoRing.rotation.x = Math.PI / 2;
    world.add(holoRing);
    this.bridgeHoloRing = holoRing;

    this.bridgeCrew = new THREE.Group();
    world.add(this.bridgeCrew);
    this.createBridgeCrew();
    this.camera.position.set(0, 4.65, 18.5);
    this.camera.lookAt(0, 2.9, -17);
  }

  createBridgeCrew() {
    if (!this.bridgeCrew) return;
    this.bridgeCrew.clear();
    const maya = this.createAstronaut();
    maya.position.set(-6.35, 0, -10.8);
    maya.scale.setScalar(1.55);
    maya.rotation.y = .42;
    const leo = this.createAstronaut();
    leo.position.set(6.35, 0, -10.8);
    leo.scale.setScalar(1.55);
    leo.rotation.y = -.42;
    this.bridgeCrew.add(maya, leo);
  }

  renderRoutes() {
    const options = document.querySelector('#route-options');
    options.replaceChildren();
    ROUTES.forEach((route, index) => {
      const button = document.createElement('button');
      button.className = `route${index === this.routeIndex ? ' selected' : ''}`;
      button.innerHTML = `<span>MODULE / 0${index + 1}</span><h3>${route.name.replace(' SYSTEM', '')}</h3><p>${route.worlds.join(' · ')}</p>`;
      button.addEventListener('click', () => {
        this.routeIndex = index;
        this.route = ROUTES[index];
        this.renderRoutes();
      });
      options.append(button);
    });
  }

  updateDialogue() {
    const [speaker, role, line] = DIALOGUE[this.dialogueIndex];
    document.querySelector('#speaker').textContent = speaker;
    document.querySelector('#role').textContent = role;
    document.querySelector('#dialogue-line').textContent = line;
    document.querySelector('#dialogue-count').textContent = `${String(this.dialogueIndex + 1).padStart(2, '0')} / ${String(DIALOGUE.length).padStart(2, '0')}`;
  }

  advanceDialogue() {
    if (this.state !== 'briefing') return;
    this.dialogueIndex += 1;
    if (this.dialogueIndex < DIALOGUE.length) {
      this.updateDialogue();
      return;
    }
    this.setGameState('routes');
    this.bridgeWorld.visible = false;
    document.querySelector('#briefing').classList.remove('visible');
    document.querySelector('#routes').classList.add('visible');
  }

  launch() {
    if (this.state !== 'routes') return;
    document.querySelector('#routes').classList.remove('visible');
    this.setGameState('flight');
    this.flightDistance = 0;
    this.flightHull = 100;
    this.gatesPassed = 0;
    this.input.clear();
    this.scene.background.set(0x030913);
    this.scene.fog = new THREE.FogExp2(0x030913, 0.004);
    this.bridgeWorld.visible = false;
    this.campusWorld.visible = false;
    this.interiorWorld.visible = false;
    this.flightWorld.visible = true;
    this.ship.visible = true;
    this.ship.position.set(0, 0, 2);
    this.ship.rotation.set(0, 0, 0);
    this.createFlightRoute();
    this.hud.showFlight(this.route);
    this.hud.updateFlight(0, this.flightHull, 0, this.gates.length);
    this.hud.notify('FLIGHT SYSTEMS ONLINE · THE SHIP WILL CONTINUE TOWARD THE LANDING ZONE');
  }

  restart() {
    document.querySelector('#result').classList.remove('visible');
    this.setGameState('routes');
    this.dialogueIndex = 0;
    this.input.clear();
    this.hud.flight.classList.remove('visible');
    this.hud.surface.classList.remove('visible');
    this.scene.background.set(0x030913);
    this.scene.fog = new THREE.FogExp2(0x030913, 0.004);
    this.bridgeWorld.visible = false;
    this.campusWorld.visible = false;
    this.interiorWorld.visible = false;
    document.querySelector('#routes').classList.add('visible');
  }

  createFlightRoute() {
    this.disposeChildren(this.flightWorld);
    this.gates = [];
    this.asteroids = [];
    const route = this.route;
    const gateDistances = [100, 210, 320, 430, 525];
    const offsets = [[0, 0], [-1.35, .8], [1.25, -1.1], [-.8, -1.3], [0, 0]];
    gateDistances.forEach((distance, index) => {
      const [x, y] = offsets[index];
      const group = this.createGate(route.accent, index === gateDistances.length - 1 ? 5.1 : 3.7);
      group.position.set(x, y, -distance);
      this.flightWorld.add(group);
      this.gates.push({ group, distance, x, y, passed: false });
    });

    const asteroidData = [[-2.8, 1.2, 74, 1.3], [2.7, -1.4, 145, .9], [0, 2.8, 179, 1.1], [2.6, 1.7, 275, 1.3], [-2.6, -1.7, 360, 1.15], [2.8, -.4, 475, 1.35]];
    asteroidData.forEach(([x, y, distance, radius]) => {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(radius, 1),
        new THREE.MeshStandardMaterial({ color: 0x5a4a5d, roughness: .9, flatShading: true }),
      );
      rock.position.set(x, y, -distance);
      rock.rotation.set(Math.random() * 4, Math.random() * 4, Math.random() * 4);
      this.flightWorld.add(rock);
      this.asteroids.push({ mesh: rock, x, y, distance, radius, hit: false, spin: (Math.random() - .5) * 1.5 });
    });

    const planet = this.createPlanet(route.planet, route.accent, 46, true, route.target);
    planet.position.set(18, -8, -650);
    this.flightWorld.add(planet);
    this.destinationPlanet = planet;
  }

  createGate(color, radius) {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, metalness: .55, roughness: .18 });
    const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, .16, 10, 52), material);
    outer.scale.y = 1.27;
    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius - .55, .028, 8, 52), new THREE.MeshBasicMaterial({ color: 0xfff6c9 }));
    inner.scale.y = 1.27;
    group.add(outer, inner);
    for (let index = 0; index < 4; index += 1) {
      const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.2), material);
      marker.position.set(Math.sin(index * Math.PI / 2) * radius, Math.cos(index * Math.PI / 2) * radius * 1.27, 0);
      group.add(marker);
    }
    return group;
  }

  createStarField() {
    const points = [];
    for (let index = 0; index < 4500; index += 1) {
      const radius = 140 + Math.random() * 470;
      const theta = Math.random() * Math.PI * 2;
      const elevation = Math.acos(2 * Math.random() - 1);
      points.push(
        radius * Math.sin(elevation) * Math.cos(theta),
        radius * Math.cos(elevation),
        radius * Math.sin(elevation) * Math.sin(theta) - 260,
      );
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    return new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc9ebff, size: .45, sizeAttenuation: true, transparent: true, opacity: .88 }));
  }

  createRocket() {
    const group = new THREE.Group();
    const hull = new THREE.MeshStandardMaterial({ color: 0xe7f4f6, metalness: .65, roughness: .28 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x1c4f6a, metalness: .7, roughness: .22 });
    const glow = new THREE.MeshBasicMaterial({ color: 0x86efff, transparent: true, opacity: .88 });
    const add = (geometry, material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };
    const body = add(new THREE.CylinderGeometry(.48, .72, 3.05, 12), hull, 0, 0, .2);
    body.rotation.x = Math.PI / 2;
    const nose = add(new THREE.ConeGeometry(.48, 1.25, 12), hull, 0, 0, -1.7);
    nose.rotation.x = -Math.PI / 2;
    const canopy = add(new THREE.SphereGeometry(.4, 18, 12), trim, 0, .24, -.58);
    canopy.scale.set(1, .65, 1.3);
    [-1, 1].forEach((side) => {
      const wing = add(new THREE.BoxGeometry(1.55, .09, 1), trim, side * 1.05, 0, .42);
      wing.rotation.z = side * .15;
      const engine = add(new THREE.CylinderGeometry(.18, .25, .46, 12), glow, side * .32, 0, 1.78);
      engine.rotation.x = Math.PI / 2;
    });
    const flame = add(new THREE.ConeGeometry(.32, 1.15, 10), glow, 0, 0, 2.34);
    flame.rotation.x = Math.PI / 2;
    group.userData.flame = flame;
    return group;
  }

  updateFlight(delta, elapsed) {
    const lateral = this.input.axis('left', 'right');
    const vertical = this.input.axis('down', 'up');
    const boost = this.input.has('boost') ? 1 : 0;
    const speed = 31 + boost * 31;
    this.flightDistance = Math.min(620, this.flightDistance + speed * delta);
    this.ship.position.x = clamp(this.ship.position.x + lateral * delta * 5.4, -5, 5);
    this.ship.position.y = clamp(this.ship.position.y + vertical * delta * 5.4, -3.9, 3.9);
    this.ship.rotation.z = THREE.MathUtils.lerp(this.ship.rotation.z, -lateral * .28, 1 - Math.exp(-delta * 7));
    this.ship.rotation.x = THREE.MathUtils.lerp(this.ship.rotation.x, vertical * .16, 1 - Math.exp(-delta * 7));
    this.ship.userData.flame.scale.z = 1 + boost * .75 + Math.sin(elapsed * 19) * .08;
    this.engineLight.intensity = 9 + boost * 8;

    this.gates.forEach((gate) => {
      gate.group.rotation.z += delta * .25;
      if (!gate.passed && this.flightDistance >= gate.distance) {
        gate.passed = true;
        const aligned = Math.hypot(this.ship.position.x - gate.x, this.ship.position.y - gate.y) < 2.75;
        if (aligned) {
          this.gatesPassed += 1;
          gate.group.traverse((node) => {
            if (node.material?.emissive) node.material.emissiveIntensity = .25;
          });
          this.hud.notify(`GATE ${this.gatesPassed} LOCKED · COURSE STABLE`);
        } else {
          this.damage('GATE MISSED · AUTOPILOT STABILIZED THE APPROACH');
        }
      }
    });

    this.asteroids.forEach((asteroid) => {
      asteroid.mesh.rotation.x += delta * asteroid.spin;
      asteroid.mesh.rotation.y += delta * asteroid.spin * .63;
      if (!asteroid.hit && Math.abs(this.flightDistance - asteroid.distance) < 2.2) {
        const collided = Math.hypot(this.ship.position.x - asteroid.x, this.ship.position.y - asteroid.y) < asteroid.radius + .55;
        if (collided) {
          asteroid.hit = true;
          asteroid.mesh.visible = false;
          this.damage('ASTEROID CONTACT · HULL INTEGRITY REDUCED');
        }
      }
    });

    if (this.destinationPlanet) this.destinationPlanet.rotation.y += delta * .03;
    this.camera.position.lerp(new THREE.Vector3(this.ship.position.x * .2, this.ship.position.y * .2 + 2.4, 14), 1 - Math.exp(-delta * 5));
    this.camera.lookAt(this.ship.position.x * .4, this.ship.position.y * .4, -6);
    this.hud.updateFlight(this.flightDistance, this.flightHull, this.gatesPassed, this.gates.length);

    if (this.flightDistance >= 560) this.beginLanding();
  }

  damage(message) {
    this.flightHull = Math.max(20, this.flightHull - 16);
    this.hud.notify(message);
  }

  beginLanding() {
    if (this.state !== 'flight') return;
    this.setGameState('landing');
    this.input.clear();
    this.landingElapsed = 0;
    this.engineLight.intensity = 0;
    this.flightWorld.visible = false;
    this.ship.visible = false;
    this.createCampus();
    this.campusWorld.visible = true;
    this.scene.background.set(this.route.sky);
    this.scene.fog = new THREE.FogExp2(this.route.sky, .012);
    this.hud.showSurface(
      this.route,
      'DESCENT / LANDING SEQUENCE',
      this.route.place,
      'MAYA: Landing zone confirmed. Bringing Orbit Runner down to the campus pad.',
      'AUTOMATED DESCENT · EXPLORATION BEGINS AFTER TOUCHDOWN',
    );
    this.hud.notify(`${this.route.target.toUpperCase()} ORBIT REACHED · DESCENT INITIATED`);
  }

  createCampus() {
    this.disposeChildren(this.campusWorld);
    const route = this.route;
    const world = this.campusWorld;
    const material = (color, roughness = .65, metalness = .15) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const accent = material(route.accent, .25, .4);
    const pavement = material(0x355a67, .8);
    const wall = material(0xf0e5cf, .5);
    const frame = material(0x102b3b, .65, .35);
    const glass = new THREE.MeshStandardMaterial({ color: route.accent, emissive: route.accent, emissiveIntensity: .45, metalness: .55, roughness: .18 });
    const lawn = material(route.ground, .9);
    const add = (geometry, mat, x, y, z, parent = world) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const box = (width, height, depth, mat, x, y, z) => add(new THREE.BoxGeometry(width, height, depth), mat, x, y, z);

    const ground = add(new THREE.PlaneGeometry(210, 180), lawn, 0, 0, -42);
    ground.rotation.x = -Math.PI / 2;
    box(18, .06, 94, material(0xe5d6ae, .9), 0, .04, -31);
    box(88, .06, 12, pavement, 0, .06, -28);
    const pad = add(new THREE.CylinderGeometry(8, 8.6, .35, 56), pavement, 0, .16, 9);
    const padRing = add(new THREE.TorusGeometry(6.8, .11, 10, 64), accent, 0, .39, 9);
    padRing.rotation.x = Math.PI / 2;
    [-1.15, 1.15].forEach((x) => box(.18, .03, 3.2, accent, x, .37, 9));
    box(2.4, .03, .18, accent, 0, .37, 9);

    const building = (name, x, z, width, height, depth, tint = wall) => {
      box(width, height, depth, tint, x, height / 2, z);
      box(width + 3, .45, depth + 3, frame, x, height + .24, z);
      for (let row = 0; row < Math.max(1, Math.floor(height / 4)); row += 1) {
        for (let wx = x - width / 2 + 3.2; wx < x + width / 2 - 1; wx += 5) {
          box(2.8, 1.75, .12, glass, wx, 2.3 + row * 3.5, z + depth / 2 + .07);
        }
      }
      const sign = add(new THREE.BoxGeometry(Math.min(width * .56, 21), 1.3, .13), frame, x, height - .8, z + depth / 2 + .16);
      sign.userData.label = name;
      return sign;
    };

    building(`${route.school} / CENTRAL HALL`, 0, -55, 76, 15, 16);
    building('WEST LIBRARY', -48, -37, 31, 11, 18, material(0xffbc9b, .5));
    building('SCIENCE LABS', 48, -37, 31, 11, 18, material(0xa4d7f3, .5));
    building('STUDENT CANTEEN', -47, -8, 32, 9, 16, material(0xffd382, .5));
    building('OBSERVATORY', 47, -8, 29, 9, 16, material(0xc6b2ff, .5));
    box(29, 1.2, 8, frame, 0, 2.2, -45);
    box(33, .4, 11, frame, 0, 5.3, -45);

    const planter = (x, z, color) => {
      add(new THREE.CylinderGeometry(1.2, 1.45, .65, 12), frame, x, .33, z);
      add(new THREE.SphereGeometry(1.15, 14, 10), material(color, .8), x, 1.35, z);
    };
    const bench = (x, z, rotation = 0) => {
      const group = new THREE.Group();
      group.position.set(x, .35, z);
      group.rotation.y = rotation;
      world.add(group);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(4.1, .15, .65), frame);
      seat.position.y = .45;
      group.add(seat);
      [-1.55, 1.55].forEach((offset) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(.14, .7, .46), frame);
        leg.position.set(offset, .08, 0);
        group.add(leg);
      });
    };
    for (let z = -20; z >= -76; z -= 12) {
      bench(-17, z); bench(17, z, Math.PI);
      planter(-8, z, route.accent); planter(8, z, 0x52aa6e);
    }
    [-65, -55, 55, 65].forEach((x) => [-6, -27, -57].forEach((z) => planter(x, z, route.accent)));

    const horizon = this.createPlanet(route.planet, route.accent, 31, routeIndexNeedsRings(this.routeIndex), route.target);
    horizon.position.set(52, 30, -125);
    world.add(horizon);
    const glow = new THREE.PointLight(route.accent, 11, 90);
    glow.position.set(0, 20, -30);
    world.add(glow);

    this.lander = this.createRocket();
    this.lander.scale.setScalar(1.18);
    this.lander.position.set(0, 25, -18);
    world.add(this.lander);
    this.explorer = this.createAstronaut();
    this.explorer.position.set(0, 0, 5);
    this.explorer.rotation.y = Math.PI;
    this.explorer.visible = false;
    world.add(this.explorer);
    this.createClassroom();
  }

  createClassroom() {
    if (this.explorer?.parent === this.interiorWorld) this.interiorWorld.remove(this.explorer);
    this.disposeChildren(this.interiorWorld);
    const world = this.interiorWorld;
    const route = this.route;
    const material = (color, roughness = .65, metalness = .12) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const wood = material(0x9b694a, .82);
    const darkWood = material(0x4e3027, .8);
    const wall = material(0xf2e5ce, .74);
    const trim = material(0x173141, .5, .42);
    const glass = new THREE.MeshStandardMaterial({ color: route.accent, emissive: route.accent, emissiveIntensity: .35, roughness: .2, transparent: true, opacity: .78 });
    const floor = material(0xb98862, .9);
    const add = (geometry, mat, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(x, y, z);
      world.add(mesh);
      return mesh;
    };
    const box = (width, height, depth, mat, x, y, z) => add(new THREE.BoxGeometry(width, height, depth), mat, x, y, z);

    const roomFloor = add(new THREE.PlaneGeometry(26, 28), floor, 0, 0, -5);
    roomFloor.rotation.x = -Math.PI / 2;
    box(26, 6.5, .35, wall, 0, 3.25, -19);
    box(.35, 6.5, 28, wall, -13, 3.25, -5);
    box(.35, 6.5, 28, wall, 13, 3.25, -5);
    box(11.4, 3.1, .14, trim, 0, 3.5, -18.72);
    box(10.3, 2.15, .06, material(0x143d37, .48, .2), 0, 3.5, -18.62);
    box(9.6, .08, .12, material(route.accent, .25, .35), 0, 2.45, -18.5);

    const desk = (x, z) => {
      box(3.5, .16, 1.35, wood, x, 1.1, z);
      box(3.72, .1, 1.57, darkWood, x, 1.25, z);
      [-1.35, 1.35].forEach((offset) => box(.12, 1.1, .12, darkWood, x + offset, .52, z));
      box(1.25, .12, .92, trim, x, .55, z + 1.42);
      [-.47, .47].forEach((offset) => box(.1, .57, .1, trim, x + offset, .25, z + 1.42));
    };
    [-5.1, 0, 5.1].forEach((x) => [-4, -8.3, -12.6].forEach((z) => desk(x, z)));

    const shelf = (x) => {
      box(2.4, 4.4, .55, darkWood, x, 2.2, -17.9);
      for (let level = 0; level < 3; level += 1) {
        box(2.2, .08, .66, wood, x, .9 + level * 1.2, -17.55);
        for (let book = 0; book < 5; book += 1) box(.22, .55, .28, material(book % 2 ? route.accent : 0xf3d681, .6), x - .78 + book * .38, 1.22 + level * 1.2, -17.18);
      }
    };
    shelf(-10.7); shelf(10.7);

    for (const x of [-12.78, 12.78]) {
      for (const z of [-2, -8, -14]) box(.08, 2.1, 3.2, glass, x, 3.7, z);
    }
    [-9.8, 9.8].forEach((x) => {
      add(new THREE.CylinderGeometry(.55, .7, .65, 12), trim, x, .33, 3.2);
      add(new THREE.SphereGeometry(.82, 14, 10), material(0x5ca778, .88), x, 1.1, 3.2);
    });
    [-5, 5].forEach((x) => {
      const lamp = new THREE.PointLight(route.accent, 3, 18);
      lamp.position.set(x, 5.7, -7);
      world.add(lamp);
      box(4.6, .08, .38, material(0xe7faff, .25), x, 5.95, -7);
    });
    const globeStand = add(new THREE.CylinderGeometry(.7, 1.05, 1.6, 16), trim, 0, .8, -16);
    this.classroomGlobe = this.createPlanet(route.planet, route.accent, 1.22, routeIndexNeedsRings(this.routeIndex), route.target);
    this.classroomGlobe.position.set(0, 2.55, -16);
    world.add(globeStand, this.classroomGlobe);
  }

  getPlanetTexture(name) {
    if (this.planetTextures.has(name)) return this.planetTextures.get(name);
    const texture = this.textureLoader.load(`./textures/${name}.png`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    this.planetTextures.set(name, texture);
    return texture;
  }

  createPlanet(color, accent, radius, rings, textureName) {
    const group = new THREE.Group();
    const map = textureName ? this.getPlanetTexture(textureName) : null;
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 48, 32),
      new THREE.MeshStandardMaterial({ color: map ? 0xffffff : color, map, roughness: .84, emissive: color, emissiveIntensity: map ? .04 : .13 }),
    );
    group.add(planet);
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.025, 40, 24), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .13 }));
    group.add(atmosphere);
    if (rings) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius * 1.35, radius * 1.82, 90), new THREE.MeshBasicMaterial({ map: this.getPlanetTexture('Ring'), color: 0xffe3a8, transparent: true, opacity: .72, side: THREE.DoubleSide }));
      ring.rotation.set(1.17, .16, -.24);
      group.add(ring);
    }
    return group;
  }

  createAstronaut() {
    const group = new THREE.Group();
    const suit = new THREE.MeshStandardMaterial({ color: 0xf6fbf8, roughness: .62, metalness: .12 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x1b485c, roughness: .45, metalness: .55 });
    const visorMaterial = new THREE.MeshStandardMaterial({ color: 0x081822, emissive: 0x113d4b, emissiveIntensity: .35, roughness: .17, metalness: .85 });
    const add = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return mesh;
    };
    add(new THREE.CapsuleGeometry(.36, .8, 6, 12), suit, 0, 1.12, 0);
    const helmet = add(new THREE.SphereGeometry(.42, 20, 14), suit, 0, 1.9, 0);
    const visor = add(new THREE.SphereGeometry(.3, 20, 14), visorMaterial, 0, 1.9, -.26);
    visor.scale.z = .35;
    add(new THREE.BoxGeometry(.58, .72, .24), suit, 0, 1.2, .32);
    [-1, 1].forEach((side) => {
      const arm = add(new THREE.CapsuleGeometry(.115, .46, 5, 8), suit, side * .42, 1.26, 0);
      arm.rotation.z = side * .12;
      add(new THREE.CapsuleGeometry(.14, .47, 5, 8), suit, side * .2, .5, 0);
      add(new THREE.BoxGeometry(.24, .17, .31), trim, side * .21, .09, -.02);
    });
    add(new THREE.BoxGeometry(.46, .16, .08), trim, 0, 1.22, -.35);
    add(new THREE.BoxGeometry(.3, .03, .42), trim, 0, 1.48, -.23);
    return group;
  }

  updateLanding(delta) {
    this.landingElapsed += delta;
    const amount = ease(clamp(this.landingElapsed / 7.2, 0, 1));
    this.lander.position.set(0, THREE.MathUtils.lerp(25, 1.35, amount), THREE.MathUtils.lerp(-18, 9, amount));
    this.lander.rotation.z = Math.sin(this.landingElapsed * 3.4) * .025 * (1 - amount);
    this.camera.position.set(
      THREE.MathUtils.lerp(16, 13, amount),
      THREE.MathUtils.lerp(33, 15, amount),
      THREE.MathUtils.lerp(38, 29, amount),
    );
    this.camera.lookAt(0, THREE.MathUtils.lerp(15, 1.2, amount), THREE.MathUtils.lerp(-18, 9, amount));
    if (amount === 1 && this.landingElapsed > 8.2) this.beginExplore();
  }

  beginExplore() {
    if (this.state !== 'landing') return;
    this.setGameState('explore');
    this.explorer.visible = true;
    this.hud.showSurface(
      this.route,
      'ON FOOT / MAYA / REPRESENTATIVE',
      'Walk the campus quad, investigate the field labs, then enter the central hall.',
      'MAYA: I’ll investigate the school. Stay on comms, Leo.',
      'WASD / ARROWS · WALK   SHIFT / SPACE · RUN',
    );
    this.hud.notify('TOUCHDOWN CONFIRMED · ON-FOOT EXPLORATION UNLOCKED');
  }

  enterClassroom() {
    if (this.state !== 'explore') return;
    this.setGameState('interior');
    this.input.clear();
    this.campusWorld.visible = false;
    this.interiorWorld.visible = true;
    this.explorer.position.set(0, 0, 5.5);
    this.explorer.rotation.set(0, Math.PI, 0);
    this.interiorWorld.add(this.explorer);
    this.hud.showSurface(
      this.route,
      `INSIDE / ${this.route.school}`,
      'Explore the classroom, then approach the planetary globe at the front.',
      'MAYA: This school is different on every world, but curiosity feels familiar.',
      'WASD / ARROWS · WALK   SHIFT / SPACE · RUN',
    );
    this.hud.notify('CENTRAL HALL ENTERED · CLASSROOM EXPLORATION UNLOCKED');
  }

  updateExplore(delta, elapsed) {
    const horizontal = this.input.axis('left', 'right');
    const forward = this.input.axis('up', 'down');
    const running = this.input.has('boost');
    const moving = horizontal !== 0 || forward !== 0;
    const speed = running ? 8 : 4.4;
    if (moving) {
      const magnitude = Math.hypot(horizontal, forward);
      const dx = horizontal / magnitude;
      const dz = forward / magnitude;
      const isInterior = this.state === 'interior';
      const xLimit = isInterior ? 11.4 : 78;
      const zMin = isInterior ? -17.1 : -105;
      const zMax = isInterior ? 7.2 : 28;
      this.explorer.position.x = clamp(this.explorer.position.x + dx * speed * delta, -xLimit, xLimit);
      this.explorer.position.z = clamp(this.explorer.position.z + dz * speed * delta, zMin, zMax);
      this.explorer.rotation.y = THREE.MathUtils.lerp(this.explorer.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-delta * 11));
      this.explorer.position.y = Math.abs(Math.sin(elapsed * 10)) * .035;
    } else {
      this.explorer.position.y = 0;
    }
    const isInterior = this.state === 'interior';
    const targetPosition = new THREE.Vector3(this.explorer.position.x, isInterior ? 5.6 : 7.2, this.explorer.position.z + (isInterior ? 9.6 : 12));
    this.camera.position.lerp(targetPosition, 1 - Math.exp(-delta * 3.4));
    this.camera.lookAt(this.explorer.position.x, 1.15, this.explorer.position.z - 5);
    if (this.state === 'interior' && this.explorer.position.z < -14 && Math.abs(this.explorer.position.x) < 2.5) this.finishExplore();
    if (this.state === 'explore' && this.explorer.position.z < -46 && Math.abs(this.explorer.position.x) < 6) this.enterClassroom();
  }

  finishExplore() {
    if (this.state !== 'explore') return;
    this.setGameState('result');
    this.input.clear();
    document.querySelector('#result-eyebrow').textContent = 'CAMPUS DISCOVERED';
    document.querySelector('#result-title').textContent = 'Welcome to the academy.';
    document.querySelector('#result-copy').textContent = `Maya reached ${this.route.school} after passing ${this.gatesPassed} of ${this.gates.length} flight gates with ${this.flightHull}% hull integrity.`;
    document.querySelector('#result').classList.add('visible');
  }

  frame(time) {
    const delta = Math.min(.05, (time - this.lastFrame) / 1000 || 0);
    this.lastFrame = time;
    const elapsed = this.clock.getElapsedTime();
    if (this.bridgeWorld.visible) {
      this.bridgeHologram.rotation.y += delta * .42;
      this.bridgeHoloRing.rotation.z -= delta * .28;
    }
    if (this.state === 'flight') this.updateFlight(delta, elapsed);
    if (this.state === 'landing') this.updateLanding(delta);
    if (this.state === 'explore' || this.state === 'interior') this.updateExplore(delta, elapsed);
    this.starField.rotation.y += delta * .002;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((nextTime) => this.frame(nextTime));
  }

  disposeChildren(group) {
    group.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose());
    });
    group.clear();
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function routeIndexNeedsRings(index) {
  return index !== 0;
}

export { OrbitRunnerGame };
