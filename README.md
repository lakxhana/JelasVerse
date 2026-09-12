# Orbit Runner

A lightweight, dependency-minimal Three.js game. The environments are procedural and it uses one shared, locally hosted GLB astronaut for the bridge and landing scenes.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Teacher dashboard

The game has a separate teacher-only dashboard at
`http://127.0.0.1:4173/teacher-dashboard.html`. It is opened from the
**Teacher** control beside Settings and requires the authorised teacher Google
account. The dashboard deliberately contains no fictional learner records; it
is ready for a later, explicit progress-data integration.

## iPhone controller (optional)

Keep the game server running, then in a second terminal run:

```sh
node phone-controller-server.js
```

Keep the iPhone and laptop on the same Wi-Fi. The command prints an `iPhone:` address; open that address in Safari on the phone. The controller sends only live button presses to the local laptop and resets automatically if the phone disconnects.

## Project structure

- `index.html` — semantic game UI and overlays
- `styles.css` — responsive HUD, dialogue, and navigation styling
- `src/main.js` — application bootstrap
- `src/OrbitRunnerGame.js` — OOP game state, flight, landing, and exploration logic
- `vendor/three.module.js` — local Three.js runtime
- `models/walking-astronaut.glb` — the supplied astronaut, loaded once and cloned for scenes
- `models/space-fighter/` — the supplied flight craft and its locally hosted textures

The game does not fetch remote fonts or assets. It will run offline once the local server is started.
