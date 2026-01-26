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

let weaveMaterial = null;
let materialA = null;
let materialB = null;

const selectedFabricKeyA = ref('silk');
const selectedFabricKeyB = ref('cotton');

const propertiesA = computed(() => fabricsProperties[selectedFabricKeyA.value]);
const propertiesB = computed(() => fabricsProperties[selectedFabricKeyB.value]);

const colorA = ref('#d00000');
const colorB = ref('#0000d0');

function updatePhysicalMaterial(mat, props) {
  if (!mat) return;

  mat.roughness = props.roughness;
  mat.metalness = props.metalness;
  mat.sheen = props.sheen;
  mat.sheenRoughness = props.sheenRoughness;
  mat.anisotropy = props.anisotropy;
  mat.specularIntensity = props.specularIntensity;

  mat.needsUpdate = true;
}

watch(propertiesA, (newProperties) => {
  updatePhysicalMaterial(materialA, newProperties);

  if (!weaveMaterial) return;
  const shader = weaveMaterial.userData.shader;
  if (!shader || !newProperties) return;

  const u = shader.uniforms;

  for (const [key, value] of Object.entries(newProperties)) {
    u[key + 'A'].value = value;
  }
});

watch(propertiesB, (newProperties) => {
  updatePhysicalMaterial(materialB, newProperties);

  if (!weaveMaterial) return;
  const shader = weaveMaterial.userData.shader;
  if (!shader || !newProperties) return;

  const u = shader.uniforms;

  for (const [key, value] of Object.entries(newProperties)) {
    u[key + 'B'].value = value;
  }
});

watch(colorA, (newColor) => {
  if (materialA) {
    materialA.color.set(newColor);
  }

  if (!weaveMaterial) return;
  const shader = weaveMaterial.userData.shader;
  if (!shader || !newColor) return;

  shader.uniforms.colorA.value.set(newColor);
});

watch(colorB, (newColor) => {
  if (materialB) {
    materialB.color.set(newColor);
  }

  if (!weaveMaterial) return;
  const shader = weaveMaterial.userData.shader;
  if (!shader || !newColor) return;

  shader.uniforms.colorB.value.set(newColor);
});

export function useClothMaterial() {
  function getMaterialA() {
    if (!materialA) {
      materialA = new THREE.MeshPhysicalMaterial({
        map: colorA.value,
        roughness: propertiesA.value.roughness,
        metalness: propertiesA.value.metalness,
        sheen: propertiesA.value.sheen,
        sheenRoughness: propertiesA.value.sheenRoughness,
        anisotropy: propertiesA.value.anisotropy,
        specularIntensity: propertiesA.value.specularIntensity,
      });
    }

    return materialA;
  }

  function getMaterialB() {
    if (!materialB) {
      materialB = new THREE.MeshPhysicalMaterial({
        map: colorB.value,
        roughness: propertiesB.value.roughness,
        metalness: propertiesB.value.metalness,
        sheen: propertiesB.value.sheen,
        sheenRoughness: propertiesB.value.sheenRoughness,
        anisotropy: propertiesB.value.anisotropy,
        specularIntensity: propertiesB.value.specularIntensity,
      });
    }

    return materialB;
  }

  function updateTileCount(newTileCount) {
    const shader = weaveMaterial.userData.shader;
    if (!shader) return;

    const newTiling = new THREE.Vector2(newTileCount, newTileCount);
    shader.uniforms.tiling.value = newTiling;
  }

  function updateResolution(newResolution) {
    const shader = weaveMaterial.userData.shader;
    if (!shader) return;

    shader.uniforms.resolution.value = newResolution;
  }

  function getWeaveMaterial(mask, resolution, tileCount) {
    const tiling = new THREE.Vector2(tileCount, tileCount);

    if (weaveMaterial) {
      const shader = weaveMaterial.userData.shader;
      if (shader) {
        shader.uniforms.mask.value = mask;
        shader.uniforms.tiling.value = tiling;
      }
      return weaveMaterial;
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
          float edge = 0.5;

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
          '#include <normal_fragment_maps>',
          `
          #include <normal_fragment_maps>

          float heightScale = 2.0;
          float h = (waveMask - 0.5) * -heightScale;

          vec3 localNormal = normalize(vec3(-dFdx(h), -dFdy(h), 1.0));

          vec3 t = normalize(dFdx(vViewPosition));
          vec3 b = normalize(dFdy(vViewPosition));
          mat3 TBN = mat3(t, b, normalize(normal));
          normal = normalize(TBN * localNormal);
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
          roughnessFactor = mix(roughnessA, roughnessB, m);
        `,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          `
          #include <metalnessmap_fragment>
          metalnessFactor = mix(metalnessA, metalnessB, m);
        `,
        )
        .replace(
          '#include <sheen_fragment>',
          `
          #include <sheen_fragment>
          sheen = mix(sheenA, sheenB, m);
          sheenRoughness = mix(sheenRoughnessA, sheenRoughnessB, m);
        `,
        )
        .replace(
          '#include <anisotropy_fragment>',
          `
          #include <anisotropy_fragment>
          anisotropy = mix(anisotropyA, anisotropyB, m);
        `,
        )
        .replace(
          '#include <specular_fragment>',
          `
          #include <specular_fragment>
          specularIntensity = mix(specularIntensityA, specularIntensityB, m);
        `,
        );
    };

    weaveMaterial = mat;
    return weaveMaterial;
  }

  return {
    fabricsProperties,
    getMaterialA,
    getMaterialB,
    getWeaveMaterial,
    updateTileCount,
    updateResolution,
    selectedFabricKeyA,
    selectedFabricKeyB,
    colorA,
    colorB,
  };
}
