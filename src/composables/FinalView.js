import * as THREE from "three";
import { Cloth } from "/src/physics/Cloth";
import { meshes } from "@/physics/meshes";
import { usePatternGrid } from '@/composables/patternGrid';

import { useClothMaterial } from './ClothMaterial';

const { gridSize, tileCount} =usePatternGrid();
const { getWeaveMaterial, updateTileCount, updateResolution } = useClothMaterial();

export function useFinalView() {
  let scene, camera, renderer;
  let cloth;

  const physics = {
    gravity: [0, -10, 0],
    dt: 1 / 60,
    substeps: 15
  };

  function init(_scene, _renderer, _texture) {
    scene = _scene
    renderer = _renderer;

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 1, 2);
    camera.lookAt(0, 0.8, 0);

    cloth = new Cloth(meshes[0], scene, _texture);

    onResize();
    window.addEventListener("resize", onResize);
  }

  function simulate() {
    const sdt = physics.dt / physics.substeps;

    for (let i = 0; i < physics.substeps; i++) {
      cloth.preSolve(sdt, physics.gravity);
      cloth.solve(sdt);
      cloth.postSolve(sdt);
    }

    cloth.endFrame();
  }

  function update() {
    simulate();
    renderer.render(scene, camera);
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  return { init, update, updateTileCount, updateResolution };
}