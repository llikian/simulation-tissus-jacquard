<script setup>
import ThreeScene from './components/ThreeScene.vue';
import ToolsBar from './components/ToolsBar.vue';
import InputGrid from './components/InputGrid.vue';

import { ref } from 'vue';

const displayGrid = ref(false);

function toggleGrid() {
  displayGrid.value = !displayGrid.value;
}
</script>

<template>
  <div class="page theme-dark">
    <ToolsBar :onToggleGrid="toggleGrid" :displayGrid="displayGrid" />
    <div class="content">
      <ThreeScene />
      <InputGrid v-if="displayGrid" />
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.content {
  display: flex;
}
</style>
