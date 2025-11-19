<script setup>
import { ref, watch, computed } from 'vue';

const gridSize = ref(8);
const grid = ref([]);

function fillGrid(fillValue) {
  grid.value = Array.from({ length: gridSize.value }, () =>
    Array.from({ length: gridSize.value }, () => fillValue),
  );
}

fillGrid(false);

function toggleCell(i, j) {
  grid.value[i][j] = !grid.value[i][j];
}

function toggleGrid() {
  grid.value = grid.value.map((row) => row.map((cell) => !cell));
}

const fillF = ref(1);
const fillT = ref(1);
const fillOffsetDelay = ref(1);
const fillOffset = ref(1);
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
}

function adjustGrid(newSize) {
  const oldGrid = grid.value;
  const newGrid = [];

  for (let i = 0; i < newSize; i++) {
    newGrid[i] = [];
    for (let j = 0; j < newSize; j++) {
      newGrid[i][j] = oldGrid[i] && oldGrid[i][j] !== undefined ? oldGrid[i][j] : false;
    }
  }

  grid.value = newGrid;
}

const flatGrid = computed(() => {
  return grid.value.flatMap((row, i) => row.map((value, j) => ({ i, j, value })));
});

watch(gridSize, (newValue) => {
  adjustGrid(newValue);
});
</script>

<template>
  <div class="grid-panel">
    <div class="grid" :style="{ '--grid-size': gridSize }">
      <div
        v-for="(cell, index) in flatGrid"
        :key="index"
        class="cell"
        :class="{ active: cell.value }"
        @click="toggleCell(cell.i, cell.j)"
      ></div>
    </div>
    <div class="grid-settings">
      <label>
        Grid size :
        <input type="number" v-model="gridSize" />
      </label>
      <div class="grid-buttons">
        <button @click="fillGrid(false)">Clear</button>
        <button @click="fillGrid(true)">Fill</button>
        <button @click="toggleGrid">Flip</button>
      </div>
      <div class="pattern-maker">
        <label>X False number : <input type="number" min="0" v-model="fillF" /></label>
        <label>X True number : <input type="number" min="0" v-model="fillT" /></label>
        <label>Y offset delay : <input type="number" min="0" v-model="fillOffsetDelay" /></label>
        <label>Y offset : <input type="number" min="0" v-model="fillOffset" /></label>
        <button @click="fillPattern(fillF, fillT, fillOffsetDelay, fillOffset)">Pattern</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grid {
  display: grid;
  width: 95%;
  max-height: 50%;
  aspect-ratio: 1;
  grid-template-columns: repeat(var(--grid-size), 1fr);
  padding: 0 0.5rem;
}

.cell {
  background-color: var(--text);
  border: 1px solid var(--background);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cell.active {
  background-color: var(--background-alt);
  transition: background-color 0.15s ease;
}

.grid-settings {
  display: flex;
  flex-direction: column;
}

.grid-buttons {
  display: flex;
  margin-bottom: 1rem;
}

.pattern-maker {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  row-gap: 8px;
  max-width: 16rem;
  align-items: center;
}

.pattern-maker label {
  display: contents;
}

.pattern-maker input {
  width: 100%;
}
</style>
