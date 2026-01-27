<script setup>
import ThreeScene from './components/ThreeScene.vue';
import ToolsBar from './components/ToolsBar.vue';
import InputGrid from './components/InputGrid.vue';
import InputMaterial from './components/InputMaterial.vue';
import { usePatternGrid } from './composables/patternGrid';

import { ref } from 'vue';
import { Panel, PanelGroup, PanelResizeHandle } from 'vue-resizable-panels';

const { fillGrid } = usePatternGrid();
fillGrid(false); // grid initialisation

const leftSize = ref(10);
const rightSize = ref(20);

const displayGrid = ref(true);
const displayMaterial = ref(false);
const meshView = ref(true);
const groupKey = ref(0);

function toggleGrid() {
  displayGrid.value = !displayGrid.value;
}

function toggleView() {
  meshView.value = !meshView.value;
}

function toggleMaterial() {
  displayMaterial.value = !displayMaterial.value;
}
</script>

<template>
  <div class="page">
    <ToolsBar :onToggleGrid="toggleGrid" :displayGrid="displayGrid" :onToggleView="toggleView" :currentView="meshView"
      :onToggleMat="toggleMaterial" :displayMat="displayMaterial" />
    <div class="content">
      <PanelGroup :key="groupKey" class="panel-group" direction="horizontal">
        <Panel v-show="displayMaterial" :size="leftSize" :defaultSize="15" :minSize="10" :maxSize="45" @resize="leftSize = $event">
          <InputMaterial />
        </Panel>
        <PanelResizeHandle class="resize-handle" />
        <Panel :size="100">
          <ThreeScene :meshView="meshView" />
        </Panel>
        <PanelResizeHandle class="resize-handle" />
        <Panel v-show="displayGrid" :size="rightSize" :defaultSize="20" :minSize="10" :maxSize="45"
          @resize="rightSize = $event">
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
