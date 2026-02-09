import * as THREE from 'three';
import { usePatternGrid } from '@/composables/patternGrid';
import { useClothMaterial } from './ClothMaterial';
import { watch } from 'vue';
const { grid, gridSize } = usePatternGrid();
const { getMaterialA, getMaterialB } = useClothMaterial();

let rowCurves, rowInstances, columnCurves, columnInstances;
const rowsMaterial = getMaterialA();
const columnsMaterial = getMaterialB();
const threadDistance = 0.1;
const threadHeight = threadDistance / 4.0;

function create_tube(curve) {
  return new THREE.TubeGeometry(curve, gridSize.value * 8, threadDistance / 2.0, 8, false);
}

export function useClothMesh() {
  function init_curves(scene) {
    if (rowInstances != null) {
      rowInstances.forEach((mesh) => {
        mesh.geometry.dispose();
        scene.remove(mesh);
      });
    }

    if (columnInstances != null) {
      columnInstances.forEach((mesh) => {
        mesh.geometry.dispose();
        scene.remove(mesh);
      });
    }

    rowCurves = [];
    rowInstances = [];
    columnCurves = [];
    columnInstances = [];

    for (let i = 0; i < gridSize.value; i++) {
      rowCurves.push(new THREE.CatmullRomCurve3([]));
      columnCurves.push(new THREE.CatmullRomCurve3([]));

      for (let j = 0; j < gridSize.value; j++) {
        rowCurves[i].points.push(new THREE.Vector3(threadDistance * j, 0.0, threadDistance * i));
        columnCurves[i].points.push(new THREE.Vector3(threadDistance * i, 0.0, threadDistance * j));
      }


      const displacement = threadDistance * (-gridSize.value / 2.0);

      rowInstances.push(new THREE.Mesh(create_tube(rowCurves[i]), rowsMaterial));
      rowInstances[i].translateX(displacement);
      rowInstances[i].translateZ(displacement);
      scene.add(rowInstances[i]);

      columnInstances.push(new THREE.Mesh(create_tube(columnCurves[i]), columnsMaterial));
      columnInstances[i].translateX(displacement);
      columnInstances[i].translateZ(displacement);
      scene.add(columnInstances[i]);
    }

    update_curves();
  }

  function update_row_curve(curve_index) {
    const curve = rowCurves[curve_index];

    for (let j = 0; j < gridSize.value; j++) {
      curve.points[j].y = grid.value[curve_index][j] ? -threadHeight : threadHeight;
    }

    rowInstances[curve_index].geometry.dispose();
    rowInstances[curve_index].geometry = create_tube(curve);
  }

  function update_column_curve(curve_index) {
    const curve = columnCurves[curve_index];

    for (let i = 0; i < gridSize.value; i++) {
      curve.points[i].y = grid.value[i][curve_index] ? threadHeight : -threadHeight;
    }

    columnInstances[curve_index].geometry.dispose();
    columnInstances[curve_index].geometry = create_tube(curve);
  }

  function update_curves() {
    for (let i = 0; i < gridSize.value; i++) {
      update_row_curve(i);
      update_column_curve(i);
    }
  }

  return { init_curves, update_row_curve, update_column_curve, update_curves };
}
