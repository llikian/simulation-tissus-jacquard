<script setup>
import { ref, watch, computed } from 'vue';
import { usePatternGrid } from '@/composables/patternGrid';

const { grid, gridSize, tileCount, fillGrid, toggleCell, toggleGrid, fillPattern, adjustGridSize } =
  usePatternGrid();

const patternWidth = ref(2);
const patternHeight = ref(2);

const pattern = ref([]);

function resizePattern() {
  const old = pattern.value;
  const newGrid = [];

  for (let i = 0; i < patternHeight.value; i++) {
    newGrid[i] = [];
    for (let j = 0; j < patternWidth.value; j++) {
      newGrid[i][j] = old[i]?.[j] ?? false;
    }
  }

  pattern.value = newGrid;
}

resizePattern();

const flatGrid = computed(() => {
  return grid.value.flatMap((row, i) => row.map((value, j) => ({ i, j, value })));
});

const flatPattern = computed(() => {
  return pattern.value.flatMap((row, i) => row.map((value, j) => ({ i, j, value })));
});

function togglePatternCell(i, j) {
  pattern.value[i][j] = !pattern.value[i][j];
}

watch(gridSize, (newValue) => {
  adjustGridSize(newValue);
});

watch([patternWidth, patternHeight], resizePattern);
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
        <input type="number" v-model="gridSize" min="1" />
      </label>
      <label>
        Tile count :
        <input type="number" v-model="tileCount" min="1" />
      </label>
      <div class="grid-buttons">
        <button @click="fillGrid(false)">Clear</button>
        <button @click="fillGrid(true)">Fill</button>
        <button @click="toggleGrid">Flip</button>
      </div>
      <div class="pattern-maker">
        <div class="pattern-size">
          <label
            >Width
            <input type="number" v-model="patternWidth" min="1" />
          </label>
          <label
            >Height
            <input type="number" v-model="patternHeight" min="1" />
          </label>
          <button @click="fillPattern(pattern)">Pattern</button>
        </div>
        <div class="pattern" :style="{ '--pattern-width': patternWidth }">
          <div
            v-for="(pattern, index) in flatPattern"
            :key="index"
            class="cell"
            :class="{ active: pattern.value }"
            @click="togglePatternCell(pattern.i, pattern.j)"
          ></div>
        </div>
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

.pattern {
  display: grid;
  width: 95%;
  max-height: 50%;
  aspect-ratio: 1;
  grid-template-columns: repeat(var(--pattern-width), 1fr);
  padding: 0 0.5rem;
}

.pattern-size {
  display: flex;
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
  gap: 1rem;
}

.grid-buttons {
  display: flex;
  margin-bottom: 1rem;
}

.pattern-maker {
  display: flex;
  flex-direction: column;
  grid-template-columns: auto 1fr;
  max-width: 16rem;
  max-height: 20%;
  gap: 1rem;
  align-items: center;
}

.pattern-maker label {
  display: contents;
}

.pattern-maker input {
  width: 100%;
}
</style>
