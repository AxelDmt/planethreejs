import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import TWEEN from '@tweenjs/tween.js';


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
scene.fog = new THREE.Fog(0xd5ad69, 50, 500);

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
const planeGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth, 1000, 1000);
const planeMaterial = new THREE.MeshPhongMaterial(
    {
        color: 0xd28e5c,
        side: THREE.DoubleSide,
        displacementMap: heightMap,
        displacementScale: 100,
        shininess: 50,
    });
const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
mesh.position.set(0, 40, 0);
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

// Créer le système de particules de sable
const sandParticlesGeometry = new THREE.BufferGeometry();
const sandParticleCount = 10000; // Nombre de particules de sable
const sandPositions = new Float32Array(sandParticleCount * 3); // Tableau pour stocker les positions des particules

// Remplir le tableau avec des positions aléatoires pour les particules
for (let i = 0; i < sandParticleCount * 3; i += 3) {
    const x = Math.random() * worldWidth - worldHalfWidth;
    const y = Math.random()* 1000; // Vous pouvez ajuster la hauteur des particules
    const z = Math.random() * worldDepth - worldHalfDepth;

    sandPositions[i] = x;
    sandPositions[i + 1] = y;
    sandPositions[i + 2] = z;
}

// Ajouter les positions au geometry
sandParticlesGeometry.setAttribute('position', new THREE.BufferAttribute(sandPositions, 3));

// Créer le matériau des particules
const sandMaterial = new THREE.PointsMaterial({
    size: 2, // Taille des particules
    color: 0xd2b48c, // Couleur du sable
    opacity: 0.3,
    transparent: true,
    blending: THREE.AdditiveBlending // Mélange additif pour un effet de transparence
});

// Créer le système de particules
const sandParticles = new THREE.Points(sandParticlesGeometry, sandMaterial);
scene.add(sandParticles);

// Mouvement des particules de sable pour simuler le vent
function moveSandParticles() {
    const sandPositions = sandParticlesGeometry.attributes.position.array;

    for (let i = 0; i < sandPositions.length; i += 3) {
        // Vous pouvez ajouter ici une variation aléatoire pour simuler le mouvement du vent
        sandPositions[i] += Math.random() - 0.5; // Variation horizontale
        sandPositions[i + 1] += Math.random() * 0.1 - 0.05; // Variation verticale
        sandPositions[i + 2] += Math.random() - 0.5; // Variation horizontale

        // Réinitialiser la position si la particule sort de la zone du désert
        if (sandPositions[i] > worldHalfWidth || sandPositions[i] < -worldHalfWidth ||
            sandPositions[i + 2] > worldHalfDepth || sandPositions[i + 2] < -worldHalfDepth) {
            sandPositions[i] = Math.random() * worldWidth - worldHalfWidth;
            sandPositions[i + 1] = Math.random() * 100;
            sandPositions[i + 2] = Math.random() * worldDepth - worldHalfDepth;
        }
    }

    // Mettre à jour les attributs de la géométrie
    sandParticlesGeometry.attributes.position.needsUpdate = true;
}

// Variables pour surveiller l'état des touches
var spacePressed = false;
var zPressed = false;
var qPressed = false;
var sPressed = false;
var dPressed = false;

// Fonction pour déplacer l'objet vers la gauche
function moveLeft() {
    var tween = new TWEEN.Tween(player.position)
        .to({  x: player.position.x - 1 }, 0) // destination, durée
        .easing(TWEEN.Easing.Quadratic.Out) // fonction d'interpolation
        .start(); // démarrer l'animation

    // Rotation de l'objet
    var rotationTween = new TWEEN.Tween(player.rotation)
        .to({ y: player.rotation.y + Math.PI / 100 }, 0) 
        .start();
}

// Fonction pour déplacer l'objet vers la droite
function moveRight() {
    var tween = new TWEEN.Tween(player.position)
        .to({ x: player.position.x + 1 }, 0)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    // Rotation de l'objet
    var rotationTween = new TWEEN.Tween(player.rotation)
        .to({ y: player.rotation.y - Math.PI / 100 }, 0) 
        .start();
}

// Fonction pour déplacer l'objet vers le haut
function moveUp() {
    var tween = new TWEEN.Tween(player.position)
        .to({  y: player.position.y + 1 }, 0)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    /*var rotationTween = new TWEEN.Tween(player.rotation)
        .to({ x: player.rotation.x - Math.PI / 100 }, 0) 
        .start();*/
}

// Fonction pour déplacer l'objet vers le bas
function moveDown() {
    var tween = new TWEEN.Tween(player.position)
        .to({  y: player.position.y - 1 }, 0)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    /*var rotationTween = new TWEEN.Tween(player.rotation)
        .to({ x: player.rotation.x + Math.PI / 100 }, 0) 
        .start();*/
}

// Variable pour stocker la vitesse de déplacement
var moveSpeed = 0;

// Fonction pour avancer le joueur dans sa direction actuelle (en tenant compte de l'inclinaison)
function moveForward() {
    // Calcul des composantes x, y et z du vecteur de déplacement en fonction de l'orientation et de l'inclinaison du joueur
    var deltaX = Math.sin(player.rotation.y) * Math.cos(player.rotation.x);
    var deltaY = Math.sin(player.rotation.x);
    var deltaZ = Math.cos(player.rotation.y) * Math.cos(player.rotation.x);

    // Déplacement du joueur en fonction de la vitesse
    player.position.x -= deltaX * moveSpeed;
    player.position.y += deltaY * moveSpeed;
    player.position.z -= deltaZ * moveSpeed;
}
// Créer un AudioListener
const listener = new THREE.AudioListener();
camera.add(listener); // Attacher le listener à la caméra pour qu'il suive les mouvements de la caméra

// Charger le fichier audio de l'hélice de l'avion
const audioLoader = new THREE.AudioLoader();
let airplaneSound;

audioLoader.load('/assets/airplane-taxi-long_KWCzxadO.mp3', function (buffer) {
    airplaneSound = new THREE.Audio(listener);
    airplaneSound.setBuffer(buffer);
    airplaneSound.setLoop(true);
    airplaneSound.setVolume(1); // Volume du son
});

// Création de l'objet Audio et chargement du fichier audio
const desertAmbientSound = new THREE.Audio(listener);
const audioLoader2 = new THREE.AudioLoader();

audioLoader2.load('assets/desert.mp3', function(buffer) {
    desertAmbientSound.setBuffer(buffer);
    desertAmbientSound.setLoop(true);
    desertAmbientSound.setVolume(0.5); // Volume du bruit ambiant
    desertAmbientSound.play(); // Démarre la lecture du son
});

// Ajout de l'objet Audio à la caméra pour qu'il suive les mouvements de la caméra
camera.add(desertAmbientSound);

// Fonction pour gérer l'événement de pression de la touche
function onKeyDown(event) {
    switch (event.keyCode) {
        case 32: // Espace
            spacePressed = true;
            // Augmenter la vitesse de déplacement lorsque la touche d'espace est enfoncée
            moveSpeed = 2;
            // Démarrer la lecture du son de l'avion à hélice lorsque la touche d'espace est enfoncée
            if (airplaneSound) {
                airplaneSound.play();
            }
            break;
        case 90: // Z
            zPressed = true;
            break;
        case 81: // Q
            qPressed = true;
            break;
        case 83: // S
            sPressed = true;
            break;
        case 68: // D
            dPressed = true;
            break;
        default:
            break;
    }
}

// Fonction pour gérer l'événement de relâchement de la touche
function onKeyUp(event) {
    switch (event.keyCode) {
        case 32: // Espace
            spacePressed = false;
            // Réduire progressivement la vitesse de déplacement lorsque la touche d'espace est relâchée
            var inertiaTween = new TWEEN.Tween({ speed: moveSpeed })
                .to({ speed: 0 }, 100) // Réduire la vitesse à zéro en 1 seconde
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(function () {
                    moveSpeed = this.speed;
                })
                .start();
            // Arrêter la lecture du son de l'avion à hélice lorsque la touche d'espace est relâchée
            if (airplaneSound) {
                airplaneSound.stop();
            }
            break; 
        case 90: // Z
            zPressed = false;
            break;
         case 81: // Q
            qPressed = false;
            break;
        case 83: // S
            sPressed = false;
            break;
        case 68: // D
            dPressed = false;
            break;
        default:
            break;
    }
}

// Ajout des gestionnaires d'événements
document.addEventListener('keydown', onKeyDown, false);
document.addEventListener('keyup', onKeyUp, false);

// Fonction d'animation
function animate() {
    requestAnimationFrame(animate);
    if (spacePressed) {
        // Déplacer l'objet le long de l'axe des x
        moveForward(); // Vous pouvez ajuster cette valeur selon vos besoin
        helix.rotateZ(5);
    }
    if (zPressed) {
        // Augmenter la position de l'objet le long de l'axe des y
        moveUp(); // Vous pouvez ajuster cette valeur selon vos besoins
    }
    if (sPressed) {
        // Augmenter la position de l'objet le long de l'axe des y
        moveDown(); // Vous pouvez ajuster cette valeur selon vos besoins
    }
    if (qPressed) {
        // Augmenter la position de l'objet le long de l'axe des y
        moveLeft(); // Vous pouvez ajuster cette valeur selon vos besoins
    }
    if (dPressed) {
        // Augmenter la position de l'objet le long de l'axe des y
        moveRight(); // Vous pouvez ajuster cette valeur selon vos besoins
    }
    TWEEN.update();
    var distance = 50; // Distance entre la caméra et l'objet
    var offset = new THREE.Vector3(0, 10, distance);
    var cameraOffset = offset.applyMatrix4(player.matrixWorld);
    camera.position.copy(cameraOffset);
    camera.lookAt(player.position);
    moveSandParticles();
    renderer.render(scene, camera);
}
animate();