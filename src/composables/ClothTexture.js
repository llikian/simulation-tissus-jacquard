import * as THREE from 'three';
import { watch } from 'vue';

import { usePatternGrid } from '@/composables/patternGrid';
const { grid, gridSize, tileCount } = usePatternGrid();

import { useClothMaterial } from './ClothMaterial';
const { getWeaveMaterial, updateTileCount, updateResolution } = useClothMaterial();

let textureCanvas = null;
let textureCtx = null;
let maskTexture = null;
let mesh = null;

const textureResolution = 1024;

function drawGrid() {
  const cellSize = textureResolution / gridSize.value;

  for (let i = 0; i < gridSize.value; i++) {
    for (let j = 0; j < gridSize.value; j++) {
      textureCtx.fillStyle = grid.value[i][j] ? '#ffffff' : '#000000';

      textureCtx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
    }
  }
}

function getMaskTexture() {
  if (maskTexture) {
    drawGrid();
    maskTexture.needsUpdate = true;
    return maskTexture;
  }

  textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureResolution;
  textureCanvas.height = textureResolution;
  textureCtx = textureCanvas.getContext('2d');

  drawGrid();

  maskTexture = new THREE.CanvasTexture(textureCanvas);
  maskTexture.magFilter = THREE.NearestFilter;
  maskTexture.minFilter = THREE.NearestFilter;
  maskTexture.wrapS = THREE.RepeatWrapping;
  maskTexture.wrapT = THREE.RepeatWrapping;

  return maskTexture;
}

watch(tileCount, (newValue) => {
  if (!mesh || newValue <= 0) return;

  updateTileCount(newValue);
});

export function useClothTexture() {
  function initTexture(scene) {
    const mask = getMaskTexture();

    const shaderMaterial = getWeaveMaterial(mask, gridSize.value, tileCount.value);

    const geometry = new THREE.PlaneGeometry(1, 1);
    mesh = new THREE.Mesh(geometry, shaderMaterial);
    mesh.rotation.x = -(Math.PI / 2);

    scene.add(mesh);
  }

  function updateTexture() {
    drawGrid();
    updateResolution(gridSize.value);
    maskTexture.needsUpdate = true;
  }

  function getTexture() {
    return maskTexture;
  }

  return { initTexture, updateTexture, getTexture };
}
