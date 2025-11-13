import * as THREE from 'three';
import {Vector3} from 'three';

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
cube.position.z = -5.0;
scene.add(cube);

const geometry = new THREE.BufferGeometry();
const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshLambertMaterial({color: 0x00ffff})
);
scene.add(mesh);
mesh.position.z = -5.0;

const WORLD_UP = new Vector3(0.0, 1.0, 0.0);

document.addEventListener("keypress", (event) => {
    const MOVEMENT_SPEED = 0.1;
    const direction = new Vector3();

    switch (event.key) {
        case "z":
            camera.getWorldDirection(direction);
            camera.position.add(direction.multiplyScalar(MOVEMENT_SPEED));
            break;
        case "s":
            camera.getWorldDirection(direction);
            camera.position.add(direction.multiplyScalar(-MOVEMENT_SPEED));
            break;
        case "d":
            camera.getWorldDirection(direction);
            camera.position.add(direction.cross(WORLD_UP).multiplyScalar(MOVEMENT_SPEED));
            break;
        case "q":
            camera.getWorldDirection(direction);
            camera.position.add(direction.cross(WORLD_UP).multiplyScalar(-MOVEMENT_SPEED));
            break;
    }

    event.preventDefault();
});

document.addEventListener("mousemove", (event) => {
    const SPEED = 0.01;

    camera.rotation.y -= SPEED * event.movementX;
    camera.rotation.x -= SPEED * event.movementY;
})

renderer.setAnimationLoop(() => {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
});