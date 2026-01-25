import { ref } from 'vue';
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

const propertiesA = ref(fabricsProperties.silk);
const propertiesB = ref(fabricsProperties.cotton);
const colorA = ref(0xd00000);
const colorB = ref(0x0000d0);

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

  function getMixedMaterial(mask, tileCount) {
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

          float m;
        `,
        )
        .replace(
          '#include <map_fragment>',
          `
        #include <map_fragment>
        m = texture2D(mask, fract(vUv * tiling)).r;
        `,
        )
        .replace(
          '#include <color_fragment>',
          `
        #include <color_fragment>
        diffuseColor.rgb = mix(colorA, colorB, m);
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

    mixedMaterial = mat;
    return mixedMaterial;
  }

  function updateProperiesA(newProperties) {
    const shader = mixedMaterial.userData.shader;
    if (!shader || !newProperties) return;

    propertiesA.value = newProperties;

    const u = shader.uniforms;

    for (const key of propertiesA.value.keys) {
      u[key + 'A'].value = propertiesA.value[key];
    }
  }

  function updateProperiesB(newProperties) {
    const shader = mixedMaterial.userData.shader;
    if (!shader || !newProperties) return;

    propertiesB.value = newProperties;

    const u = shader.uniforms;

    for (const key of propertiesB.value.keys) {
      u[key + 'B'].value = propertiesB.value[key];
    }
  }

  function updateColorA(newColor) {
    const shader = mixedMaterial.userData.shader;
    if (!shader || !newColor) return;

    colorA.value = newColor;

    shader.uniforms.colorA.value.set(colorA);
  }

  function updateColorB(newColor) {
    const shader = mixedMaterial.userData.shader;
    if (!shader || !newColor) return;

    colorB.value = newColor;

    shader.uniforms.colorB.value.set(colorB);
  }

  function updateTileCount(newTileCount) {
    const shader = mixedMaterial.userData.shader;
    if (!shader) return;

    const newTiling = new THREE.Vector2(newTileCount, newTileCount);
    shader.uniforms.tiling.value = newTiling;
  }

  return {
    fabricsProperties,
    getMixedMaterial,
    updateTileCount,
    updateProperiesA,
    updateProperiesB,
    updateColorA,
    updateColorB,
  };
}
