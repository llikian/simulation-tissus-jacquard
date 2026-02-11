<script setup>
import { onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';
import { useClothMesh } from '@/composables/ClothMesh';
import { useClothTexture } from '@/composables/ClothTexture';
import { useFinalView } from '@/composables/FinalView';

const { meshView } = defineProps(['meshView']);

const { emitter } = usePatternGrid();
const { init_curves, update_row_curve, update_column_curve, update_curves } = useClothMesh();
const { initTexture, updateTexture, getTexture } = useClothTexture();
const final = useFinalView()

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
  scene.background = new THREE.Color(0.03, 0.03, 0.03);

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 3, 3);
  scene.add(light);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  camera.position.set(0, 3, 3);
  controls.update();

  renderer.setAnimationLoop(animate);
}

function clearMeshesFromScene() {
  const toRemove = [];

  scene.traverse((obj) => {
    if (obj.isMesh) {
      toRemove.push(obj);
    }
  });

  toRemove.forEach((mesh) => {
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    scene.remove(mesh);
  });
}

function refreshSceneContent() {
  clearMeshesFromScene();

  if (meshView == 0) {
    init_curves(scene);
  } else if (meshView == 1) {
    initTexture(scene);
  } else if (meshView == 2) {
    final.init(scene, renderer, getTexture());
  }
}

function animate() {
  const delta = clock.getDelta();
  controls.update(delta);
  renderer.render(scene, camera);
  if (meshView == 2) {
    final.update();
  }
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
  refreshSceneContent();

  window.addEventListener('resize', () => {
    handleResize();
  });

  // Events when grid changed
  emitter.on('cellChanged', (cell) => {
    if (meshView == 0) {
      update_row_curve(cell.i);
      update_column_curve(cell.j);
    } else if (meshView == 1) {
      updateTexture();
    } else {
      final.update();
    }
  });

  emitter.on('gridChanged', () => {
    if (meshView == 0) {
      update_curves();
    } else if (meshView == 1) {
      updateTexture();
    } else {
      final.update();
    }
  });

  emitter.on('gridSizeChanged', () => {
    if (meshView == 0) {
      init_curves(scene);
    } else if (meshView == 1) {
      updateTexture();
    } else {
      final.update();
    }
  });
});

watch(
  () => meshView,
  () => {
    refreshSceneContent();
  },
);
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
