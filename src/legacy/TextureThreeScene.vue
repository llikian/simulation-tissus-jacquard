<script setup>
import { onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const { emitter, grid, gridSize, tileCount } = usePatternGrid();

let renderer, camera, scene, clock, controls;
let textureCanvas, textureCtx, gridTexture, textureMesh;

const textureResolution = 1024;

const materialA = new THREE.Color(0xd00000);
const materialB = new THREE.Color(0x0000d0);

function drawGrid() {
  const cellSize = textureResolution / gridSize.value;

  for (let i = 0; i < gridSize.value; i++) {
    for (let j = 0; j < gridSize.value; j++) {
      textureCtx.fillStyle = grid.value[i][j] ? '#ffffff' : '#000000';

      textureCtx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

function init_texture() {
  textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureResolution;
  textureCanvas.height = textureResolution;
  textureCtx = textureCanvas.getContext('2d');

  drawGrid();

  gridTexture = new THREE.CanvasTexture(textureCanvas);
  gridTexture.magFilter = THREE.NearestFilter;
  gridTexture.minFilter = THREE.NearestFilter;
  gridTexture.wrapS = THREE.RepeatWrapping;
  gridTexture.wrapT = THREE.RepeatWrapping;

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      mask: { value: gridTexture },
      colorA: { value: materialA },
      colorB: { value: materialB },
      tileCount: { value: 100 },
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    }
  `,
    fragmentShader: `
    uniform sampler2D mask;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float tileCount;

    varying vec2 vUv;

    void main() {
      vec2 uvTiled = fract(vUv * tileCount);
      float m = texture2D(mask, uvTiled).r;
      gl_FragColor = vec4(mix(colorA, colorB, m), 1.0);
    }
  `,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.PlaneGeometry(1, 1);
  textureMesh = new THREE.Mesh(geometry, shaderMaterial);

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
  light.position.set(0, 3, 3);
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

watch(tileCount, (newValue) => {
  if (!textureMesh || newValue <= 0) return;

  textureMesh.material.uniforms.tileCount.value = newValue;
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
