<script setup>
// import MeshThreeScene from './components/MeshThreeScene.vue';
// import TextureThreeScene from './components/TextureThreeScene.vue';
import ThreeScene from './components/ThreeScene.vue';
import ToolsBar from './components/ToolsBar.vue';
import InputGrid from './components/InputGrid.vue';
import { usePatternGrid } from './composables/patternGrid';

import { ref } from 'vue';
import { Panel, PanelGroup, PanelResizeHandle } from 'vue-resizable-panels';

const { fillGrid } = usePatternGrid();
fillGrid(false); // grid initialisation

const displayGrid = ref(true);
const meshView = ref(true);
const groupKey = ref(0);

function toggleGrid() {
  displayGrid.value = !displayGrid.value;
}

function toggleView() {
  meshView.value = !meshView.value;
}
</script>

<template>
  <div class="page">
    <ToolsBar
      :onToggleGrid="toggleGrid"
      :displayGrid="displayGrid"
      :onToggleView="toggleView"
      :currentView="meshView"
    />
    <div class="content">
      <PanelGroup :key="groupKey" class="panel-group" direction="horizontal">
        <Panel :defaultSize="displayGrid ? 70 : 100" :minSize="50">
          <ThreeScene :meshView="meshView" />
          <!-- <MeshThreeScene v-if="meshView" />
          <TextureThreeScene v-else /> -->
        </Panel>
        <PanelResizeHandle class="resize-handle" />
        <Panel
          v-show="displayGrid"
          :defaultSize="displayGrid ? 30 : 0"
          :minSize="displayGrid ? 10 : 0"
          :maxSize="displayGrid ? 50 : 0"
        >
          <InputGrid />
        </Panel>
      </PanelGroup>
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

.resize-handle {
  background-color: black;
  width: 0.5rem;
}
</style>
