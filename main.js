import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import './style.css'

import javascriptLogo from './javascript.svg'

import viteLogo from '/vite.svg'


const MODEL_URL = "public/hoshinoglb.glb";
const AUDIO_URL = "public/voice.mp3";

// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// ===== CAMERA =====
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.6, 3);

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.style.margin = "0";
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.AmbientLight(0xffffff, 1.4));

const light = new THREE.DirectionalLight(0xffffff, 2);
light.position.set(3, 10, 5);
scene.add(light);

// ===== CONTROLS =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// ===== AUDIO =====
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.PositionalAudio(listener);
const audioLoader = new THREE.AudioLoader();

document.addEventListener("click", () => {
  if (listener.context.state === "suspended") {
    listener.context.resume();
  }
});

// ===== MODEL =====
let model = null;
let mixer = null;

const loader = new GLTFLoader();

loader.load(MODEL_URL, (gltf) => {

  model = gltf.scene;
  scene.add(model);

  // ===== CENTER MODEL =====
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  model.position.sub(center);
  model.position.y += size.y / 2;

  // ===== SCALE =====
  const scale = 1.8 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);

  // ===== MATERIAL FIX =====
  model.traverse((child) => {

    if (!child.isMesh) return;

    const mats = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (const m of mats) {

      if (!m) continue;

      m.side = THREE.DoubleSide;

      if (m.map) {
        m.map.colorSpace = THREE.SRGBColorSpace;
      }

    }

  });

  // ===== ANIMATION =====
  if (gltf.animations.length > 0) {

    mixer = new THREE.AnimationMixer(model);
    mixer.clipAction(gltf.animations[0]).play();

  }

  // ===== LOAD AUDIO =====
  audioLoader.load(AUDIO_URL, (buffer) => {

    console.log("audio loaded");

    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(1);
    sound.setRefDistance(2);

    model.add(sound);

  });

});

// ===== SPACE TO TALK =====
window.addEventListener("keydown", (e) => {

  if (e.code === "Space") {

    if (sound && sound.buffer && !sound.isPlaying) {

      console.log("play voice");

      sound.play();

    }

  }

});

// ===== ANIMATE =====
const clock = new THREE.Clock();

function animate() {

  requestAnimationFrame(animate);

  const dt = clock.getDelta();

  if (mixer) mixer.update(dt);

  controls.update();
  renderer.render(scene, camera);

}

animate();

// ===== RESIZE =====
window.addEventListener("resize", () => {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

});