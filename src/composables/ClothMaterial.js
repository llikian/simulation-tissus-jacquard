import { ref, watch, computed } from 'vue';
import * as THREE from 'three';

const fabricsProperties = {
  silk: {
    roughness: 0.15,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.2,
    anisotropy: 0.9,
    specularIntensity: 1.0,
  },

  cotton: {
    roughness: 0.7,
    metalness: 0.0,
    sheen: 0.6,
    sheenRoughness: 0.8,
    anisotropy: 0.2,
    specularIntensity: 0.3,
  },

  linen: {
    roughness: 0.85,
    metalness: 0.0,
    sheen: 0.4,
    sheenRoughness: 1.0,
    anisotropy: 0.1,
    specularIntensity: 0.2,
  },
};

let mixedMaterial = null;

const selectedFabricKeyA = ref('silk');
const selectedFabricKeyB = ref('cotton');

const propertiesA = computed(() => fabricsProperties[selectedFabricKeyA.value]);
const propertiesB = computed(() => fabricsProperties[selectedFabricKeyB.value]);

const colorA = ref('#d00000');
const colorB = ref('#0000d0');

watch(propertiesA, (newProperties) => {
  if (!mixedMaterial) return;
  const shader = mixedMaterial.userData.shader;
  if (!shader || !newProperties) return;

  const u = shader.uniforms;

  for (const [key, value] of Object.entries(newProperties)) {
    u[key + 'A'].value = value;
  }
});

watch(propertiesB, (newProperties) => {
  if (!mixedMaterial) return;
  const shader = mixedMaterial.userData.shader;
  if (!shader || !newProperties) return;

  const u = shader.uniforms;

  for (const [key, value] of Object.entries(newProperties)) {
    u[key + 'B'].value = value;
  }
});

watch(colorA, (newColor) => {
  if (!mixedMaterial) return;
  const shader = mixedMaterial.userData.shader;
  if (!shader || !newColor) return;

  shader.uniforms.colorA.value.set(newColor);
});

watch(colorB, (newColor) => {
  if (!mixedMaterial) return;
  const shader = mixedMaterial.userData.shader;
  if (!shader || !newColor) return;

  shader.uniforms.colorB.value.set(newColor);
});

export function useClothMaterial() {
  // function getMaterial(properties, color) {
  //   return new THREE.MeshPhysicalMaterial({
  //     map: color,
  //     roughness: properties.roughness,
  //     metalness: properties.metalness,
  //     sheen: properties.sheen,
  //     sheenRoughness: properties.sheenRoughness,
  //     anisotropy: properties.anisotropy,
  //     specularIntensity: properties.specularIntensity,
  //   });
  // }

  // function updateMaterial(material, properties, color) {
  //   material.map = color;
  //   material.roughness = properties.roughness;
  //   material.metalness = properties.metalness;
  //   material.sheen = properties.sheen;
  //   material.sheenRoughness = properties.sheenRoughness;
  //   material.anisotropy = properties.anisotropy;
  //   material.specularIntensity = properties.specularIntensity;
  // }

  function updateTileCount(newTileCount) {
    const shader = mixedMaterial.userData.shader;
    if (!shader) return;

    const newTiling = new THREE.Vector2(newTileCount, newTileCount);
    shader.uniforms.tiling.value = newTiling;
  }

  function updateResolution(newResolution) {
    const shader = mixedMaterial.userData.shader;
    if (!shader) return;

    shader.uniforms.resolution.value = newResolution;
  }

  function getMixedMaterial(mask, resolution, tileCount) {
    console.log('Initilalizing with tilecount = ' + tileCount);
    const tiling = new THREE.Vector2(tileCount, tileCount);

    if (mixedMaterial) {
      const shader = mixedMaterial.userData.shader;
      if (shader) {
        shader.uniforms.mask.value = mask;
        shader.uniforms.tiling.value = tiling;
      }
      return mixedMaterial;
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    mat.defines = { USE_UV: '' };

    mat.onBeforeCompile = (shader) => {
      mat.userData.shader = shader;

      shader.uniforms.mask = { value: mask };
      shader.uniforms.resolution = { value: resolution };
      shader.uniforms.tiling = { value: tiling };

      shader.uniforms.colorA = { value: new THREE.Color(colorA.value) };
      shader.uniforms.colorB = { value: new THREE.Color(colorB.value) };

      for (const key in propertiesA.value) {
        shader.uniforms[key + 'A'] = { value: propertiesA.value[key] };
        shader.uniforms[key + 'B'] = { value: propertiesB.value[key] };
      }

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `
          #include <common>
          uniform sampler2D mask;
          uniform float resolution;
          uniform vec2 tiling;

          uniform vec3 colorA;
          uniform vec3 colorB;
          uniform float roughnessA;
          uniform float roughnessB;
          uniform float metalnessA;
          uniform float metalnessB;
          uniform float sheenA;
          uniform float sheenB;
          uniform float sheenRoughnessA;
          uniform float sheenRoughnessB;
          uniform float anisotropyA;
          uniform float anisotropyB;
          uniform float specularIntensityA;
          uniform float specularIntensityB;

          float stripe(vec2 p, float period, float edge)
          {
              float x = mod(p.x, period);
              float d = abs(x - period * 0.5);
              return 1.0 - smoothstep(0.0, edge, d);
          }
        `,
        )
        .replace(
          '#include <map_fragment>',
          `
          #include <map_fragment>
          vec2 uvMask = fract(vUv * tiling);
          vec2 cell = uvMask * resolution;

          float period = 2.0;
          float edge = 0.3;

          float w1x = stripe(cell.yx, period, edge);
          float w2x = stripe(cell.yx + vec2(period * 0.5, 0.0), period, edge);
          float waveX = max(w1x, w2x);

          float w1y = stripe(cell, period, edge);
          float w2y = stripe(cell + vec2(period * 0.5, 0.0), period, edge);
          float waveY = max(w1y, w2y);

          float m = texture2D(mask, uvMask).r;
          float waveMask = 1.0 - (waveX + m * (waveY - waveX));
        `,
        )
        .replace(
          '#include <color_fragment>',
          `
          #include <color_fragment>
          vec3 baseColor = mix(colorA, colorB, m);
          diffuseColor.rgb = baseColor * waveMask;
        `,
        )
        .replace(
          '#include <roughnessmap_fragment>',
          `
          #include <roughnessmap_fragment>
          float baseRoughness = mix(roughnessA, roughnessB, m);
          roughnessFactor = baseRoughness * waveMask;
        `,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `
          #include <metalnessmap_fragment>
          float baseMetalness = mix(metalnessA, metalnessB, m);
          metalnessFactor = baseMetalness * waveMask;
        `,
        )
        .replace(
          '#include <sheen_fragment>',
          `
          #include <sheen_fragment>
          float baseSheen = mix(sheenA, sheenB, m);
          float baseSheenRoughness = mix(sheenRoughnessA, sheenRoughnessB, m);
          sheen = baseSheen * waveMask;
          sheenRoughness = baseSheenRoughness * waveMask;
        `,
        )
        .replace(
          '#include <anisotropy_fragment>',
          `
          #include <anisotropy_fragment>
          float baseAnisotropy = mix(anisotropyA, anisotropyB, m);
          anisotropy = baseAnisotropy * waveMask;
        `,
        )
        .replace(
          '#include <specular_fragment>',
          `
          #include <specular_fragment>
          float baseSpecular = mix(specularIntensityA, specularIntensityB, m);
          specularIntensity = baseSpecular * waveMask;
        `,
        );
    };

    mixedMaterial = mat;
    return mixedMaterial;
  }

  return {
    fabricsProperties,
    getMixedMaterial,
    updateTileCount,
    updateResolution,
    selectedFabricKeyA,
    selectedFabricKeyB,
    colorA,
    colorB,
  };
}
