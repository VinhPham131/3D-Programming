import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164/build/three.module.js";
import * as CANNON from "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js";

const canvas = document.getElementById("gameCanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c1424);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-50, 30, -70);
camera.lookAt(0, 0, 0);

// Camera modes
const CAMERA_MODES = {
  CHASE: 'chase',
  FIRST_PERSON: 'firstPerson',
  TOP_DOWN: 'topDown',
  SIDE: 'side',
  ORBIT: 'orbit'
};

let currentCameraMode = CAMERA_MODES.CHASE;

// Camera follow settings
const cameraOffset = new THREE.Vector3(0, 3, -12); // Position relative to car
const cameraLookAheadDistance = 2; // Distance ahead of car to look at

// Orbit camera settings
let orbitAngle = 0;
const orbitRadius = 30;
const orbitHeight = 15;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.8);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(-10, 25, -10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// Physics world
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0),
});
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

const defaultMaterial = new CANNON.Material("default");
const groundMaterial = new CANNON.Material("ground");
const contact = new CANNON.ContactMaterial(groundMaterial, defaultMaterial, {
  friction: 0.5,
  restitution: 0.05,
});
world.addContactMaterial(contact);

// Track dimensions
const trackWidth = 50;
const trackLength = 100;
const trackThickness = 2;

const groundGeo = new THREE.BoxGeometry(
  trackWidth,
  trackThickness,
  trackLength
);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x1e2a44,
  metalness: 0.1,
  roughness: 0.8,
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
groundMesh.position.y = -trackThickness / 2;
scene.add(groundMesh);

const groundBody = new CANNON.Body({
  type: CANNON.Body.STATIC,
  shape: new CANNON.Box(
    new CANNON.Vec3(trackWidth / 2, trackThickness / 2, trackLength / 2)
  ),
  material: groundMaterial,
});
groundBody.position.copy(groundMesh.position);
world.addBody(groundBody);

// Track walls
const wallHeight = 2;
const wallThickness = 0.5;
const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x536878 });
const wallBodies = [];

function createWall(width, height, depth, position) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    wallMaterial
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(position);
  scene.add(mesh);

  const body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    shape: new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)),
  });
  world.addBody(body);
  wallBodies.push(body);

  return mesh;
}

createWall(
  trackWidth,
  wallHeight,
  wallThickness,
  new THREE.Vector3(0, wallHeight / 2, trackLength / 2)
);
createWall(
  trackWidth,
  wallHeight,
  wallThickness,
  new THREE.Vector3(0, wallHeight / 2, -trackLength / 2)
);
createWall(
  wallThickness,
  wallHeight,
  trackLength,
  new THREE.Vector3(trackWidth / 2, wallHeight / 2, 0)
);
createWall(
  wallThickness,
  wallHeight,
  trackLength,
  new THREE.Vector3(-trackWidth / 2, wallHeight / 2, 0)
);

createWall(
  wallThickness,
  wallHeight,
  trackLength * 0.7,
  new THREE.Vector3(0, wallHeight / 2, 0)
);

// Decorative checkpoints
const checkpointColor = 0xffd166;
const checkpointGeom = new THREE.BoxGeometry(20, 0.1, 0.5);
const checkpointMat = new THREE.MeshStandardMaterial({
  color: checkpointColor,
});

const startLineZ = -trackLength / 2 + 15;
const startLineX = -13;

function createLine(zPos, xPos) {
  const mesh = new THREE.Mesh(checkpointGeom, checkpointMat);
  mesh.position.set(xPos, 0.01, zPos);
  scene.add(mesh);
  return mesh;
}

createLine(startLineZ, startLineX);

const carDimensions = { width: 2, height: 1, length: 4 };
// Chassis body
const chassisShape = new CANNON.Box(
  new CANNON.Vec3(
    carDimensions.width / 2,
    carDimensions.height / 2,
    carDimensions.length / 2
  )
);

const chassisBody = new CANNON.Body({
  mass: 150,
  material: defaultMaterial,
  shape: chassisShape,
  position: new CANNON.Vec3(startLineX, 3, startLineZ - 10),
  angularDamping: 0.4,
});
world.addBody(chassisBody);

// RaycastVehicle
const vehicle = new CANNON.RaycastVehicle({
  chassisBody,
  indexRightAxis: 0,
  indexUpAxis: 1,
  indexForwardAxis: 2,
});

// Wheel options
const wheelOptions = {
  radius: 0.45,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionRestLength: 0.4,
  suspensionStiffness: 40,
  dampingCompression: 4.4,
  dampingRelaxation: 2.3,
  frictionSlip: 3,
  rollInfluence: 0.1,
  axleLocal: new CANNON.Vec3(-1, 0, 0),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

// Wheel positions
const wheelPositions = [
  new CANNON.Vec3(-1, -0.3, -1.6), // FL
  new CANNON.Vec3(1, -0.3, -1.6), // FR
  new CANNON.Vec3(-1, -0.3, 1.6), // RL
  new CANNON.Vec3(1, -0.3, 1.6), // RR
];

wheelPositions.forEach((p) => {
  wheelOptions.chassisConnectionPointLocal = p;
  vehicle.addWheel({ ...wheelOptions });
});

vehicle.addToWorld(world);

const carMesh = new THREE.Group();

const chassisMesh = new THREE.Mesh(
  new THREE.BoxGeometry(
    carDimensions.width,
    carDimensions.height,
    carDimensions.length
  ),
  new THREE.MeshStandardMaterial({ color: 0xff3366 })
);
chassisMesh.castShadow = true;
carMesh.add(chassisMesh);

// cabin mesh
const cabin = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 0.6, 1.8),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
cabin.position.set(0, 0.5, -0.2);
carMesh.add(cabin);

// wheel visuals
const wheelMeshes = [];

vehicle.wheelInfos.forEach((wheel) => {
  const geo = new THREE.CylinderGeometry(wheel.radius, wheel.radius, 0.3, 16);
  geo.rotateZ(Math.PI / 2);
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  mesh.castShadow = true;
  wheelMeshes.push(mesh);
  scene.add(mesh);
});

scene.add(carMesh);

// Controls
let engineForce = 0;
let steeringValue = 0;

let lastCollisionTime = 0;
const collisionCooldown = 1500;

// HUD elements
const speedValue = document.getElementById("speedValue");
const lapValue = document.getElementById("lapValue");
const lapMaxValue = document.getElementById("lapMax");
const timerValue = document.getElementById("timerValue");
const statusMessage = document.getElementById("statusMessage");
const cameraIndicator = document.getElementById("cameraIndicator");

let raceStarted = false;
let justCrossedStart = false;
let passedStartLine = false;
let finished = false;
let lapCount = 1;
let raceStartTime = 0;
const targetLaps = 3;
let checkpointReached = false;
const welcomeScreen = document.getElementById("welcomeScreen");
const resultScreen = document.getElementById("result");
let gameVisible = false;

const keyState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
};

window.addEventListener("keydown", (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      keyState.forward = true;
      break;
    case "KeyS":
    case "ArrowDown":
      keyState.backward = true;
      break;
    case "KeyA":
    case "ArrowLeft":
      keyState.left = true;
      break;
    case "KeyD":
    case "ArrowRight":
      keyState.right = true;
      break;
    case "KeyC":
      switchCamera();
      break;
    case "Escape":
      if (gameVisible && !finished) {
        welcomeScreen.style.display = "flex";
        gameVisible = false;
      }
      break;
    case "Space":
      if (!gameVisible) {
        welcomeScreen.style.display = "none";
        startRace();
        gameVisible = true;
        return;
      }
      if (finished) {
        finishRace();
      }
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      keyState.forward = false;
      break;
    case "KeyS":
    case "ArrowDown":
      keyState.backward = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      keyState.left = false;
      break;
    case "KeyD":
    case "ArrowRight":
      keyState.right = false;
      break;
    default:
      break;
  }
});

// make sure lap and HUD are initialized
lapValue.textContent = `${lapCount}`;
timerValue.textContent = "0.0";

function startRace() {
  if (chassisBody.position.z > startLineZ) raceStarted = true;
  finished = false;
  lapCount = 1;
  lapValue.textContent = lapCount;
  raceStartTime = performance.now() / 1000;
}

function resetRace() {
  raceStarted = false;
  finished = false;

  lapCount = 1;
  lapValue.textContent = lapCount;
  timerValue.textContent = "0.0";

  passedStartLine = false;

  chassisBody.position.set(startLineX, 3, startLineZ - 5);
  chassisBody.velocity.set(0, 0, 0);
  chassisBody.angularVelocity.set(0, 0, 0);
  chassisBody.quaternion.setFromEuler(0, Math.PI, 0);

  carMesh.position.copy(chassisBody.position);
  carMesh.quaternion.copy(chassisBody.quaternion);

  statusMessage.textContent = "Press Space to Start";
}

function finishRace() {
  raceStarted = false;
  finished = true;
  const elapsed = performance.now() / 1000 - raceStartTime;
  document.getElementById("finalTime").textContent = elapsed.toFixed(1);
  resultScreen.style.display = "flex";
  gameVisible = false;
}

function countLap() {
  const carZ = chassisBody.position.z;

  const crossingForward = carZ > startLineZ;

  if (crossingForward && !passedStartLine) {
    passedStartLine = true; // Mark that the line is crossed once

    if (!raceStarted || finished) return;

    lapCount++;
    lapValue.textContent = `${lapCount}`;

    if (lapCount >= targetLaps) {
      const elapsed = performance.now() / 1000 - raceStartTime;
      timerValue.textContent = `${elapsed.toFixed(1)}`;
      finishRace();
      return;
    }
  }

  // Reset trigger once car moves away from the line
  if (!crossingForward) {
    passedStartLine = false;
  }
}

function updateVehicleControls() {
  engineForce = 0;
  steeringValue = 0;

  if (keyState.forward) engineForce = -1500;
  if (keyState.backward) engineForce = 800;

  if (keyState.left) steeringValue = 0.5;
  if (keyState.right) steeringValue = -0.5;

  // Rear-wheel drive
  vehicle.applyEngineForce(engineForce, 2);
  vehicle.applyEngineForce(engineForce, 3);

  // Steering on front wheels
  vehicle.setSteeringValue(steeringValue, 2);
  vehicle.setSteeringValue(steeringValue, 3);
}

function updatePhysics(delta) {
  updateVehicleControls();
  world.step(1 / 60, delta, 3);
}

function syncVisuals() {
  // sync chassis
  carMesh.position.copy(chassisBody.position);
  carMesh.quaternion.copy(chassisBody.quaternion);

  // sync wheels
  vehicle.wheelInfos.forEach((wheel, i) => {
    vehicle.updateWheelTransform(i);

    const t = wheel.worldTransform;
    wheelMeshes[i].position.copy(t.position);
    wheelMeshes[i].quaternion.copy(t.quaternion);
  });
}

function switchCamera() {
  const modes = Object.values(CAMERA_MODES);
  const currentIndex = modes.indexOf(currentCameraMode);
  const nextIndex = (currentIndex + 1) % modes.length;
  currentCameraMode = modes[nextIndex];
  updateCameraIndicator();
}

function updateCameraIndicator() {
  const indicators = {
    [CAMERA_MODES.CHASE]: '📷 Chase Cam',
    [CAMERA_MODES.FIRST_PERSON]: '👁️ First Person',
    [CAMERA_MODES.TOP_DOWN]: '⬇️ Top Down',
    [CAMERA_MODES.SIDE]: '↔️ Side View',
    [CAMERA_MODES.ORBIT]: '🔄 Orbit Cam'
  };
  cameraIndicator.textContent = indicators[currentCameraMode];
}

function updateCameraFollow() {
  const carPosition = carMesh.position.clone();
  const carDirection = new THREE.Vector3(0, 0, 1);
  carDirection.applyQuaternion(carMesh.quaternion);

  switch (currentCameraMode) {
    case CAMERA_MODES.CHASE:
      // Chase camera - behind and above the car
      const offsetRotated = cameraOffset.clone();
      offsetRotated.applyQuaternion(carMesh.quaternion);
      const targetCameraPos = carPosition.clone().add(offsetRotated);
      camera.position.lerp(targetCameraPos, 0.1);
      
      const lookAheadPoint = carPosition.clone().add(
        carDirection.clone().multiplyScalar(cameraLookAheadDistance)
      );
      lookAheadPoint.y = carPosition.y + 1;
      camera.lookAt(lookAheadPoint);
      break;

    case CAMERA_MODES.FIRST_PERSON:
      // First-person view - inside the car
      const fpOffset = new THREE.Vector3(0, 1.5, 1.5);
      fpOffset.applyQuaternion(carMesh.quaternion);
      const fpPos = carPosition.clone().add(fpOffset);
      camera.position.lerp(fpPos, 0.2);
      
      const fpLookAhead = carPosition.clone().add(
        carDirection.clone().multiplyScalar(10)
      );
      fpLookAhead.y = carPosition.y + 0.5;
      camera.lookAt(fpLookAhead);
      break;

    case CAMERA_MODES.TOP_DOWN:
      // Top-down view - directly above the car
      const topDownPos = new THREE.Vector3(
        carPosition.x,
        carPosition.y + 40,
        carPosition.z
      );
      camera.position.lerp(topDownPos, 0.1);
      camera.lookAt(carPosition);
      break;

    case CAMERA_MODES.SIDE:
      // Side view - to the right of the car
      const sideOffset = new THREE.Vector3(15, 5, 0);
      sideOffset.applyQuaternion(carMesh.quaternion);
      const sidePos = carPosition.clone().add(sideOffset);
      camera.position.lerp(sidePos, 0.1);
      camera.lookAt(carPosition);
      break;

    case CAMERA_MODES.ORBIT:
      // Orbit camera - rotates around the car
      orbitAngle += 0.01;
      const orbitX = carPosition.x + Math.cos(orbitAngle) * orbitRadius;
      const orbitZ = carPosition.z + Math.sin(orbitAngle) * orbitRadius;
      const orbitY = carPosition.y + orbitHeight;
      camera.position.lerp(new THREE.Vector3(orbitX, orbitY, orbitZ), 0.1);
      camera.lookAt(carPosition);
      break;
  }
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updatePhysics(delta);
  syncVisuals();
  updateCameraFollow();

  countLap();
  if (!raceStarted) {
    startRace();
  }
  // update timer display while race is running
  if (raceStarted && !finished) {
    const elapsed = performance.now() / 1000 - raceStartTime;
    timerValue.textContent = elapsed.toFixed(1);
  }

  // update speed (optional)
  const speed = chassisBody.velocity.length();
  // convert m/s to km/h roughly
  const speedKmh = (speed * 3.6).toFixed(0);
  speedValue.textContent = `${speedKmh}`;


  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize camera indicator
updateCameraIndicator();

// UI Menu functionality
const controlsBtn = document.getElementById("controlsBtn");
const settingsBtn = document.getElementById("settingsBtn");
const controlsModal = document.getElementById("controlsModal");
const settingsModal = document.getElementById("settingsModal");
const closeControlsBtn = document.getElementById("closeControlsBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const menuBtn = document.getElementById("menuBtn");

controlsBtn.addEventListener("click", () => {
  controlsModal.classList.add("active");
});

settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("active");
});

closeControlsBtn.addEventListener("click", () => {
  controlsModal.classList.remove("active");
});

closeSettingsBtn.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

menuBtn.addEventListener("click", () => {
  resultScreen.style.display = "none";
  welcomeScreen.style.display = "flex";
  resetRace();
  gameVisible = false;
});

// Close modals when clicking outside
controlsModal.addEventListener("click", (e) => {
  if (e.target === controlsModal) {
    controlsModal.classList.remove("active");
  }
});

settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("active");
  }
});

animate();
