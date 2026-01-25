<script setup>
import { ref } from 'vue';
import { useClothMaterial } from '@/composables/ClothMaterial';
const { fabricsProperties } = useClothMaterial();

const colorA = ref('#d00000');
const colorB = ref('#0000d0');

const selectedFabricKeyA = ref('silk');
// const selectedFabricA = computed(() => fabricsProperties[selectedFabricKeyA.value]);

const selectedFabricKeyB = ref('cotton');
// const selectedFabricB = computed(() => fabricsProperties[selectedFabricKeyA.value]);
</script>

<template>
  <h1>Weave properties</h1>
  <div class="mat-panel">
    <div class="weave">
      <h2>Color A</h2>
      <input type="color" v-model="colorA" />
      <select v-model="selectedFabricKeyA">
        <option v-for="(value, key) in fabricsProperties" :key="key" :value="key">
          {{ key }}
        </option>
      </select>
    </div>

    <div class="weave">
      <h2>Color B</h2>
      <input type="color" v-model="colorB" />
      <select v-model="selectedFabricKeyB">
        <option v-for="(value, key) in fabricsProperties" :key="key" :value="key">
          {{ key }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.mat-panel {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}

.weave {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 8rem;
  margin: 0.5rem;
  padding: 0.5rem;
  border-style: solid;
  border-width: 1px;
  border-radius: 0.5rem;
  border-color: aliceblue;
  gap: 1rem;
}

h1 {
  font-size: 1.5rem;
  margin: 0 0 0 1rem;
}

h2 {
  font-size: 1.2rem;
  margin: 0 0 0 0.5rem;
}
</style>
