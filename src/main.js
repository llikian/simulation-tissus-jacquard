import * as THREE from 'three';
import {OrbitControls} from "three/addons/controls/OrbitControls";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0.459, 0.616, 0.851);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const light = new THREE.DirectionalLight(0xffffff);
light.rotation.x = Math.PI;
light.rotation.y = Math.PI;
scene.add(light);

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({color: 0xff0000})
);
scene.add(cube);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
camera.position.set( 0, 3, 3 );
controls.update();

function animate() {
    const delta = clock.getDelta();

    controls.update(delta);
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
