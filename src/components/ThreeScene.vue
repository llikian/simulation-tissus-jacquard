<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const { emitter, grid, gridSize } = usePatternGrid();

let renderer, camera, scene, clock, controls;
let curves, curveInstances, lineInstances; // Curves are the rows (they go up or down the lines), the lines are straight
const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
const threadDistance = 0.1;

function init_curves() {
  if (curveInstances != null) {
    curveInstances.forEach((instance) => scene.remove(instance));
  }

  if (lineInstances != null) {
    lineInstances.forEach((instance) => scene.remove(instance));
  }

  curves = new Array(gridSize.value);
  curveInstances = new Array(gridSize.value);
  lineInstances = new Array(gridSize.value);

  for (let i = 0; i < gridSize.value; i++) {
    curves[i] = new THREE.SplineCurve(new Array(gridSize.value));
    for (let j = 0; j < gridSize.value; j++) {
      curves[i].points[j] = new THREE.Vector2(threadDistance * j, 0.0)
    }

    curveInstances[i] = new THREE.Line(new THREE.BufferGeometry(), curveMaterial);
    curveInstances[i].translateX(threadDistance * (-gridSize.value / 2.0));
    curveInstances[i].translateZ(threadDistance * (-gridSize.value / 2.0 + i));
    scene.add(curveInstances[i]);

    lineInstances[i] = new THREE.Line(new THREE.BufferGeometry(), lineMaterial);
    lineInstances[i].geometry.setFromPoints(new Array(
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.0, threadDistance * gridSize.value)
    ));
    lineInstances[i].translateX(threadDistance * (-gridSize.value / 2.0 + i));
    lineInstances[i].translateZ(threadDistance * (-0.5 - gridSize.value / 2.0));
    scene.add(lineInstances[i]);
  }

  update_curves();
}

function update_curves() {
  for (let i = 0; i < gridSize.value; i++) {
    const curve = curves[i];
    for (let j = 0; j < gridSize.value; j++) {
      curve.points[j].y = grid.value[i][j] ? -threadDistance / 2 : threadDistance / 2;
    }
    curveInstances[i].geometry.setFromPoints(curve.getPoints(gridSize.value * 4));
  }
}

function setupScene() {
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.value.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  //scene.background = new THREE.Color(0.459, 0.616, 0.851);
  scene.background = new THREE.Color(0.03, 0.03, 0.03);

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  scene.add(light);

  init_curves();

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

  // Events when grid changed
  emitter.on('cellChanged', (cell) => {
    curves[cell.i].points[cell.j].y = grid.value[cell.i][cell.j] ? -threadDistance / 2 : threadDistance / 2;
    curveInstances[cell.i].geometry.setFromPoints(curves[cell.i].getPoints(gridSize.value * 4));
  });

  emitter.on('gridChanged', () => {
    update_curves();
  });

  emitter.on('gridSizeChanged', () => {
    init_curves();
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
