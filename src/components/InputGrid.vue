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

function toggle(i, j) {
  grid.value[i][j] = !grid.value[i][j];
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
        @click="toggle(cell.i, cell.j)"
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
}
</style>
