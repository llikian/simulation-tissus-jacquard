<script setup>
import { ref } from 'vue';

const gridSize = ref(8);
const grid = ref(
  Array.from({ length: gridSize.value }, () => Array.from({ length: gridSize.value }, () => false)),
);

function toggle(i, j) {
  grid.value[i][j] = !grid.value[i][j];
}
</script>

<template>
  <div class="grid" :style="{ '--grid-size': gridSize }">
    <div v-for="(row, i) in grid" :key="i" class="row">
      <div
        v-for="(cell, j) in row"
        :key="j"
        class="cell"
        :class="{ active: cell }"
        @click="toggle(i, j)"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-rows: repeat(var(--grid-size), 30px);
  gap: 2px;
  width: fit-content;
  margin: 0 0.5rem;
}

.row {
  display: grid;
  grid-template-columns: repeat(var(--grid-size), 30px);
  gap: 2px;
}

.cell {
  width: 30px;
  height: 30px;
  background-color: #ddd;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cell.active {
  background-color: black;
  transition: background-color 0.15s ease;
}
</style>
