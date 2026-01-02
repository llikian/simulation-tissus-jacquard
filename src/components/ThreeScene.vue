<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const { emitter, grid, gridSize } = usePatternGrid();

let renderer, camera, scene, clock, controls, texture, data, material;

function init_texture() {
  console.log(`init_texture (${gridSize.value})`)

  data = new Uint8Array(gridSize.value * gridSize.value);
  texture = new THREE.DataTexture(
    data,
    gridSize.value,
    gridSize.value,
    THREE.RedFormat, // 1 channel
    THREE.UnsignedByteType
  );
}

function update_texture() {
  console.log("update_texture");

  for (let i = 0; i < gridSize.value; i++) {
    for (let j = 0; j < gridSize.value; j++) {
      data[(gridSize.value - 1 - i) * gridSize.value + j] = grid.value[i][j] ? 0 : 255;
    }
  }

  texture.needsUpdate = true;
}

function update_texture_cell(cell) {
  console.log(`update_texture_cell (${cell.i}, ${cell.j})`);
  data[(gridSize.value - 1 - cell.i) * gridSize.value + cell.j] = grid.value[cell.i][cell.j] ? 0 : 255;
  texture.needsUpdate = true;
}

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

  init_texture();
  update_texture();

  material = new THREE.ShaderMaterial({
    uniforms: {
      u_grid: { value: texture },
    },
    vertexShader: `
        out vec2 v_tex_coords;

        void main() {
          v_tex_coords = uv;
          gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));
        }
      `,
    fragmentShader: `
        in vec2 v_tex_coords;

        uniform sampler2D u_grid;

        void main() {
          float val = texture(u_grid, v_tex_coords).r;

          gl_FragColor = vec4(vec3(val), 1.0f);
        }
      `,
  });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10.0, 10.0, gridSize.value * 2, gridSize.value * 2),
    material,
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

  // Events when grid changed
  emitter.on('cellChanged', (cell) => {
    update_texture_cell(cell);
  });

  emitter.on('gridChanged', () => {
    update_texture();
  });

  emitter.on('gridSizeChanged', () => {
    init_texture();
    update_texture();
    material.uniforms.u_grid.value = texture
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
