<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = ref(null);

let renderer, camera, scene, clock, controls;

function setupScene() {
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.value.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.459, 0.616, 0.851);

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  scene.add(light);

  // const cube = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 1, 1),
  //   new THREE.MeshLambertMaterial({ color: 0xff0000 }),
  // );
  // scene.add(cube);

  const material = new THREE.ShaderMaterial( {
      vertexShader: `
        out vec2 v_tex_coords;

        void main() {
          v_tex_coords = uv;
          gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0)); 
        }
      `,
      fragmentShader: `
        in vec2 v_tex_coords;
        void main() {
          gl_FragColor = vec4(v_tex_coords.x, 0.0f, v_tex_coords.y, 1.0f);
        }
      `
  });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10.0, 10.0),
    material
  );
  plane.rotateX(-Math.PI / 2.0);
  scene.add(plane);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  camera.position.set(0, 3, 3);
  controls.update();

  renderer.setAnimationLoop(animate);
}

function animate() {
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
}

function handleResize() {
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  camera.lookAt(scene.position);
}

onMounted(() => {
  setupScene();

  window.addEventListener('resize', () => {
    handleResize();
  });
});
</script>

<template>
  <div ref="container" class="three-container"></div>
</template>

<style>
.three-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
