import * as THREE from 'three';
import { watch } from 'vue';

import { usePatternGrid } from '@/composables/patternGrid';
const { grid, gridSize, tileCount } = usePatternGrid();

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

watch(tileCount, (newValue) => {
  if (!textureMesh || newValue <= 0) return;

  textureMesh.material.uniforms.tileCount.value = newValue;
});

export function useClothTexture() {
  function initTexture(scene) {
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
        tileCount: { value: tileCount.value },
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
    textureMesh.rotation.x = -(Math.PI / 2);

    scene.add(textureMesh);
  }

  function updateTexture() {
    drawGrid();
    gridTexture.needsUpdate = true;
  }

  return { initTexture, updateTexture };
}
