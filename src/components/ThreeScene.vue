<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const { emitter, grid, gridSize } = usePatternGrid();

let renderer, camera, scene, clock, controls;
let curves, curveInstances, lineInstances; // Curves are the rows (they go up or down the lines), the lines are straight
const curveMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const threadDistance = 0.1;

function create_tube(curve) {
  return new THREE.TubeGeometry(curve, gridSize.value * 4, threadDistance / 2.0, 8, false);
}

function init_curves() {
  if (curveInstances != null) {
    curveInstances.forEach((mesh) => {
      mesh.geometry.dispose();
      scene.remove(mesh);
    });
  }

  if (lineInstances != null) {
    lineInstances.forEach((mesh) => {
      mesh.geometry.dispose();
      scene.remove(mesh);
    });
  }

  curves = [];
  curveInstances = [];
  lineInstances = [];

  for (let i = 0; i < gridSize.value; i++) {
    curves.push(new THREE.CatmullRomCurve3([]));
    for (let j = 0; j < gridSize.value; j++) {
      curves[i].points.push(new THREE.Vector3(threadDistance * j, 0.0, threadDistance * i));
    }

    curveInstances.push(new THREE.Mesh(create_tube(curves[i]), curveMaterial));
    curveInstances[i].translateX(threadDistance * (-gridSize.value / 2.0));
    curveInstances[i].translateZ(threadDistance * (-gridSize.value / 2.0));
    scene.add(curveInstances[i]);

    const start_point = new THREE.Vector3(
      threadDistance * (-gridSize.value / 2.0 + i),
      0.0,
      threadDistance * (-0.5 - gridSize.value / 2.0),
    );
    lineInstances[i] = new THREE.Mesh(
      create_tube(
        new THREE.LineCurve3(
          start_point,
          new THREE.Vector3(0.0, 0.0, threadDistance * gridSize.value).add(start_point),
        ),
      ),
      lineMaterial,
    );
    scene.add(lineInstances[i]);
  }

  update_curves();
}

function update_curve(curve_index) {
  const curve = curves[curve_index];

  for (let j = 0; j < gridSize.value; j++) {
    curve.points[j].y = grid.value[curve_index][j] ? -threadDistance / 2.0 : threadDistance / 2.0;
  }

  curveInstances[curve_index].geometry.dispose();
  curveInstances[curve_index].geometry = create_tube(curve);
}

function update_curves() {
  for (let i = 0; i < gridSize.value; i++) {
    update_curve(i);
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
    update_curve(cell.i);
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
