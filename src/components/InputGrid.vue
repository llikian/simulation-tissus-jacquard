<script setup>
import { ref, watch, computed } from 'vue';
import { usePatternGrid } from '@/composables/patternGrid';

const {
  grid,
  gridSize,
  fillGrid,
  toggleCell,
  toggleGrid,
  fillPattern,
  adjustGridSize,
} = usePatternGrid();

fillGrid(false);

const fillF = ref(1);
const fillT = ref(1);
const fillOffsetDelay = ref(1);
const fillOffset = ref(1);

const flatGrid = computed(() => {
  return grid.value.flatMap((row, i) => row.map((value, j) => ({ i, j, value })));
});

watch(gridSize, (newValue) => {
  adjustGridSize(newValue);
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
