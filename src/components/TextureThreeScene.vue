<script setup>
import { onMounted, ref, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const { emitter, grid, gridSize } = usePatternGrid();

let renderer, camera, scene, clock, controls;
let textureCanvas, textureCtx, gridTexture, textureMesh;

let cellSize = 1;
const texSize = computed(() => gridSize.value * cellSize);

function drawGrid() {
  for (let i = 0; i < gridSize.value; i++) {
    for (let j = 0; j < gridSize.value; j++) {
      textureCtx.fillStyle = grid.value[i][j] ? '#050505' : '#d0d0d0';

      textureCtx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

function init_texture() {
  textureCanvas = document.createElement('canvas');
  textureCanvas.width = texSize.value;
  textureCanvas.height = texSize.value;
  textureCtx = textureCanvas.getContext('2d');

  drawGrid();

  gridTexture = new THREE.CanvasTexture(textureCanvas);
  gridTexture.magFilter = THREE.NearestFilter;
  gridTexture.minFilter = THREE.NearestFilter;
  gridTexture.wrapS = THREE.ClampToEdgeWrapping;
  gridTexture.wrapT = THREE.ClampToEdgeWrapping;

  const material = new THREE.MeshBasicMaterial({
    map: gridTexture,
    side: THREE.DoubleSide,
  });

  const planeSize = gridSize.value;
  const geometry = new THREE.PlaneGeometry(planeSize, planeSize);

  textureMesh = new THREE.Mesh(geometry, material);
  scene.add(textureMesh);
}

function update_texture() {
  drawGrid();
  gridTexture.needsUpdate = true;
}

function setupScene() {
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);
  container.value.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.03, 0.03, 0.03);

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(1, 1, 1);
  scene.add(light);

  init_texture();

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
  emitter.on('cellChanged', () => {
    update_texture();
  });

  emitter.on('gridChanged', () => {
    update_texture();
  });

  emitter.on('gridSizeChanged', () => {
    update_texture();
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
