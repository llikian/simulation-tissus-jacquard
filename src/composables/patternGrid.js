import { ref } from 'vue';
import mitt from 'mitt';

const gridSize = ref(8);
const grid = ref([]);

const emitter = mitt(); // Possible events 'gridChanged', 'gridSizeChanged'

export function usePatternGrid() {
  function notifyCell(i,j) {
    emitter.emit('cellChanged', {"x": i, "y": j});
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
    
    notifyCell(i,j);
  }

  function toggleGrid() {
    grid.value = grid.value.map((row) => row.map((cell) => !cell));

    notifyGrid();
  }

  function fillPattern(f, t, offsetDelay, offset) {
    const cycle = f + t;

    let shift = 0;

    for (let i = 0; i < gridSize.value; i++) {
      if (offsetDelay > 0) {
        shift = (Math.floor(i / offsetDelay) % 2) * offset;
      }

      for (let j = 0; j < gridSize.value; j++) {
        const shiftedIndex = (j - shift + gridSize.value) % gridSize.value;

        const posInCycle = shiftedIndex % cycle;

        grid.value[i][j] = posInCycle >= f;
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
    setPatternGrid,
    fillGrid,
    toggleCell,
    toggleGrid,
    fillPattern,
    adjustGridSize,
  };
}
