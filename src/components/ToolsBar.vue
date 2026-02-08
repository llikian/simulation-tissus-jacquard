<script setup>
defineProps([
  'onToggleGrid',
  'displayGrid',
  'onToggleView',
  'currentView',
  'onToggleFinalResult',
  'onToggleMat',
  'displayMat',
]);
</script>

<template>
  <nav>
    <button @click="onToggleMat" :class="{ active: displayMat }" class="toggle-btn">
      Toggle Material
    </button>
    <button @click="onToggleView" :class="{ active: currentView }" class="toggle-btn">
      Toggle View
    </button>
    <button @click="onToggleFinalResult" :class="{}" class="toggle-btn">
      Toggle Final Result
    </button>
    <button @click="onToggleGrid" :class="{ active: displayGrid }" class="toggle-btn">
      Toggle Grid
    </button>
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  justify-content: space-between;
  margin: 0 1rem;
}

.toggle-btn {
  margin: 0.5rem;
  font-size: large;
  padding: 0.5rem 1rem;
  color: var(--text);
  border: 2px solid var(--text);
  background-color: transparent;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  cursor: pointer;
  background-color: var(--background-alt);
}

.toggle-btn.active {
  background-color: var(--text-muted);
  color: var(--background-alt);
  border-color: var(--background-alt);
}
</style>
