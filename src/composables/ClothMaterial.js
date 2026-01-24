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

export function useClothMaterial() {
  function getMaterial(properties, color) {
    return new THREE.MeshPhysicalMaterial({
      map: color,
      roughness: properties.roughness,
      metalness: properties.metalness,
      sheen: properties.sheen,
      sheenRoughness: properties.sheenRoughness,
      anisotropy: properties.anisotropy,
      specularIntensity: properties.specularIntensity,
    });
  }

  function updateMaterial(material, properties, color) {
    material.map = color;
    material.roughness = properties.roughness;
    material.metalness = properties.metalness;
    material.sheen = properties.sheen;
    material.sheenRoughness = properties.sheenRoughness;
    material.anisotropy = properties.anisotropy;
    material.specularIntensity = properties.specularIntensity;
  }

  function getMixedMaterial(propertiesA, propertiesB, colorA, colorB, mask, tileCount) {
    const tiling = new THREE.Vector2(tileCount, tileCount);

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });

    mat.defines = { USE_UV: '' };

    mat.onBeforeCompile = (shader) => {
      mat.userData.shader = shader;

      shader.uniforms.mask = { value: mask };
      shader.uniforms.tiling = { value: tiling };

      shader.uniforms.colorA = { value: new THREE.Color(colorA) };
      shader.uniforms.colorB = { value: new THREE.Color(colorB) };

      for (const key in propertiesA) {
        shader.uniforms[key + 'A'] = { value: propertiesA[key] };
        shader.uniforms[key + 'B'] = { value: propertiesB[key] };
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

    console.log('Created Mixed Material');

    return mat;
  }

  function updateMixedMaterial(material, propertiesA, propertiesB, colorA, colorB, mask) {
    const shader = material.userData.shader;
    if (!shader) return;

    const u = shader.uniforms;

    if (mask) u.mask.value = mask;

    if (colorA) u.colorA.value.set(colorA);
    if (colorB) u.colorB.value.set(colorB);

    if ((propertiesA == undefined) & (propertiesB == undefined)) return;

    const keys = [
      'roughness',
      'metalness',
      'sheen',
      'sheenRoughness',
      'anisotropy',
      'specularIntensity',
    ];

    for (const key of keys) {
      if (propertiesA[key] !== undefined) {
        u[key + 'A'].value = propertiesA[key];
      }

      if (propertiesB[key] !== undefined) {
        u[key + 'B'].value = propertiesB[key];
      }
    }
  }

  function updateTileCount(material, newTileCount) {
    const shader = material.userData.shader;
    if (!shader) return;

    console.log('Updating Tiling');
    const newTiling = new THREE.Vector2(newTileCount, newTileCount);
    shader.uniforms.tiling.value = newTiling;
  }

  function updateMask(material, newMask) {
    const shader = material.userData.shader;
    if (!shader) return;

    console.log('Updating Mask');
    shader.uniforms.mask.value = newMask;
  }

  return {
    fabricsProperties,
    getMaterial,
    updateMaterial,
    getMixedMaterial,
    updateMixedMaterial,
    updateTileCount,
    updateMask,
  };
}
