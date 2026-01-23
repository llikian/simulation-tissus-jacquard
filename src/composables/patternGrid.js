import { ref } from 'vue';
import mitt from 'mitt';

const gridSize = ref(8);
const grid = ref([]);
let tileCount = ref(1);

const emitter = mitt(); // Possible events 'gridChanged', 'gridSizeChanged'

export function usePatternGrid() {
  function notifyCell(i, j) {
    emitter.emit('cellChanged', { i: i, j: j });
  }

  function notifyGrid() {
    emitter.emit('gridChanged');
  }

  function notifyGridSize() {
    emitter.emit('gridSizeChanged');
  }

  function setPatternGrid(newGrid) {
    grid.value = newGrid;

    notifyGrid();
  }

  function fillGrid(fillValue) {
    grid.value = Array.from({ length: gridSize.value }, () =>
      Array.from({ length: gridSize.value }, () => fillValue),
    );

    notifyGrid();
  }

  function toggleCell(i, j) {
    grid.value[i][j] = !grid.value[i][j];

    notifyCell(i, j);
  }

  function toggleGrid() {
    grid.value = grid.value.map((row) => row.map((cell) => !cell));

    notifyGrid();
  }

  function fillPattern(pattern) {
    const pH = pattern.length;
    const pW = pattern[0].length;

    for (let i = 0; i < gridSize.value; i++) {
      for (let j = 0; j < gridSize.value; j++) {
        const pi = i % pH;
        const pj = j % pW;
        grid.value[i][j] = pattern[pi][pj];
      }
    }

    notifyGrid();
  }

  function adjustGridSize(newSize) {
    const oldGrid = grid.value;
    const newGrid = [];

    for (let i = 0; i < newSize; i++) {
      newGrid[i] = [];
      for (let j = 0; j < newSize; j++) {
        newGrid[i][j] = oldGrid[i] && oldGrid[i][j] !== undefined ? oldGrid[i][j] : false;
      }
    }

    grid.value = newGrid;

    notifyGridSize();
  }

  return {
    emitter,
    grid,
    gridSize,
    tileCount,
    setPatternGrid,
    fillGrid,
    toggleCell,
    toggleGrid,
    fillPattern,
    adjustGridSize,
  };
}
