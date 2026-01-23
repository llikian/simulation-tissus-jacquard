import * as THREE from 'three';
import { usePatternGrid } from '@/composables/patternGrid';

const { grid, gridSize } = usePatternGrid();

let curves, curveInstances, lineInstances; // Curves are the rows (they go up or down the lines), the lines are straight
const curveMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const lineMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff });
const threadDistance = 0.1;

function create_tube(curve) {
  return new THREE.TubeGeometry(curve, gridSize.value * 4, threadDistance / 2.0, 8, false);
}

export function useClothMesh() {
  function init_curves(scene) {
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

  return { init_curves, update_curve, update_curves };
}
