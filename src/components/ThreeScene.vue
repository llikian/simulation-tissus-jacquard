<script setup>
import { onMounted, ref } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { usePatternGrid } from '@/composables/patternGrid';

const container = ref(null);

const {
  grid,
  gridSize
} = usePatternGrid();

let renderer, camera, scene, clock, controls;

const data = new Uint8Array(gridSize.value * gridSize.value);

const texture = new THREE.DataTexture(
  data,
  gridSize.value,
  gridSize.value,
  THREE.RedFormat,      // 1 channel
  THREE.UnsignedByteType
);

texture.magFilter = THREE.NearestFilter;  // important for grid sampling!
texture.minFilter = THREE.NearestFilter;

function update_texture() {
  for (let y = 0; y < gridSize.value; y++) {
    for (let x = 0; x < gridSize.value; x++) {
      data[y * gridSize.value + x] = grid.value[y][x] ? 0 : 255;
    }
  }

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

  // const cube = new THREE.Mesh(
  //   new THREE.BoxGeometry(1, 1, 1),
  //   new THREE.MeshLambertMaterial({ color: 0xff0000 }),
  // );
  // scene.add(cube);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      u_grid: { value: texture }
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
      `
  });

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10.0, 10.0, gridSize.value * 2, gridSize.value * 2),
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
  update_texture();

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
