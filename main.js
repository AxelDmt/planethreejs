import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';

const worldWidth = 720, worldDepth = 720,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
const gui = new GUI();

const fov = 40;
const aspect = window.innerWidth / window.innerHeight; // the canvas default
const near = 0.1;
const far = 5000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(0, 200, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 10;
controls.maxDistance = 5000;
controls.maxPolarAngle = Math.PI / 2;

//


camera.position.y = 2000;
camera.position.x = 2000;
controls.update();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8a6931);
scene.fog = new THREE.Fog(0xd5ad69, 100, 1000);

let player = new THREE.Object3D();
scene.add(player);
//player.add(camera);
let plane = null;
let helix = null;
let helix2 = null;

function LoadData() {
    new GLTFLoader()
        .setPath('assets/models/')
        .load('airplane.glb', gltfReader);
}

function gltfReader(gltf) {
    plane = gltf.scene;

    if (plane != null) {
        console.log("Model loaded:  " + plane);
        helix = plane.getObjectByName("Propeller_Cone-Mesh");
        helix2 = plane.getObjectByName("Propeller_Cone-Mesh_1");
        player.add(plane);
    } else {
        console.log("Load FAILED.  ");
    }
}

LoadData();

var heightMap = new THREE.TextureLoader().load("heightmap.png");
const planeGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth, 50, 50);
const planeMaterial = new THREE.MeshPhongMaterial(
    {
        color: 0xd28e5c,
        side: THREE.DoubleSide,
        displacementMap: heightMap,
        displacementScale: 100,
        shininess: 50,
    });
const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
mesh.position.set(0, 0, 0);
mesh.rotation.x = Math.PI / 2;
scene.add(mesh);

const sun = new THREE.SphereGeometry(100, 100, 16);

const sunmaterial = new THREE.MeshBasicMaterial({ color: 0xffbd4a });
const sunsphere = new THREE.Mesh(sun, sunmaterial);
sunsphere.position.set(1000, 500, 1000);
scene.add(sunsphere);

const light = new THREE.SpotLight(0xffbd4a, 10000000);
light.position.set(1000, 500, 1000);
light.angle = Math.PI / 2;
light.penumbra = 10;

light.decay = 2;
light.distance = 0;
light.shadow.camera.near = 1;
light.shadow.camera.far = 10;
light.shadow.focus = 1;

light.castShadow = true;

scene.add(light);
const spotLightHelper = new THREE.SpotLightHelper(light);
scene.add(spotLightHelper);

// Initialisation des drapeaux pour le déplacement continu
var keys = {};
var moveSpeed = 1;
var rotationSpeed = 0.07;

// Ajout des écouteurs d'événements pour le déplacement continu de la caméra
document.addEventListener("keydown", function (event) {
    keys[event.key] = true;
});
document.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});

// Fonction pour mettre à jour la position de la caméra en fonction des touches enfoncées
function updateCameraPosition() {
    if (helix) {
        helix.rotateZ(rotationSpeed);
        helix2.rotateZ(rotationSpeed);
    }
    if (keys["z"]) {
        // Avancer dans la direction de la caméra
        player.translateZ(-moveSpeed);
    }
    if (keys["s"]) {
        // Reculer dans la direction opposée de la caméra
        player.translateZ(moveSpeed);
    }
    if (keys["q"]) {
        // Tourner à gauche
        player.rotateY(rotationSpeed);
        player.rotateZ(0.01);
    }
    if (keys["d"]) {
        // Tourner à droite
        player.rotateY(-rotationSpeed);
    }

    if (keys["e"]) {
        // Tourner la caméra à droite autour de l'axe vertical
        player.translateX(moveSpeed);
    }
    if (keys["a"]) {
        // Tourner la caméra à droite autour de l'axe vertical
        player.translateX(-moveSpeed);
    }

}

function render(time) {
    time *= 0.001;
    renderer.render(scene, camera);
    // Suivre l'objet GLTF avec la caméra
    updateCameraPosition();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);