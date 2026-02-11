import * as THREE from "three";

import { usePatternGrid } from '@/composables/patternGrid';

import { useClothMaterial } from '@/composables/ClothMaterial';

const { gridSize, tileCount} =usePatternGrid();
const { getWeaveMaterial, updateTileCount, updateResolution } = useClothMaterial();

// ===============================
// Math helpers (OBLIGATOIRE)
// ===============================

function vecSetZero(a,anr) {
  anr *= 3;
  a[anr++] = 0;
  a[anr++] = 0;
  a[anr]   = 0;
}

function vecScale(a,anr,scale) {
  anr *= 3;
  a[anr++] *= scale;
  a[anr++] *= scale;
  a[anr]   *= scale;
}

function vecCopy(a,anr,b,bnr) {
  anr*=3; bnr*=3;
  a[anr++] = b[bnr++];
  a[anr++] = b[bnr++];
  a[anr]   = b[bnr];
}

function vecAdd(a,anr,b,bnr,scale=1) {
  anr*=3; bnr*=3;
  a[anr++] += b[bnr++] * scale;
  a[anr++] += b[bnr++] * scale;
  a[anr]   += b[bnr]   * scale;
}

function vecSetDiff(dst,dnr,a,anr,b,bnr,scale=1) {
  dnr*=3; anr*=3; bnr*=3;
  dst[dnr++] = (a[anr++] - b[bnr++]) * scale;
  dst[dnr++] = (a[anr++] - b[bnr++]) * scale;
  dst[dnr]   = (a[anr]   - b[bnr])   * scale;
}

function vecLengthSquared(a,anr) {
  anr*=3;
  let x=a[anr], y=a[anr+1], z=a[anr+2];
  return x*x+y*y+z*z;
}

function vecDistSquared(a,anr,b,bnr) {
  anr*=3; bnr*=3;
  let x=a[anr]-b[bnr];
  let y=a[anr+1]-b[bnr+1];
  let z=a[anr+2]-b[bnr+2];
  return x*x+y*y+z*z;
}

function vecSetCross(a,anr,b,bnr,c,cnr) {
  anr*=3; bnr*=3; cnr*=3;
  a[anr++] = b[bnr+1]*c[cnr+2] - b[bnr+2]*c[cnr+1];
  a[anr++] = b[bnr+2]*c[cnr+0] - b[bnr+0]*c[cnr+2];
  a[anr]   = b[bnr+0]*c[cnr+1] - b[bnr+1]*c[cnr+0];
}


// ===============================
// findTriNeighbors (OBLIGATOIRE)
// ===============================

function findTriNeighbors(triIds) {
  const edges = [];
  const numTris = triIds.length / 3;

  for (let i=0;i<numTris;i++){
    for (let j=0;j<3;j++){
      let id0 = triIds[3*i+j];
      let id1 = triIds[3*i+(j+1)%3];

      edges.push({
        id0: Math.min(id0,id1),
        id1: Math.max(id0,id1),
        edgeNr: 3*i+j
      });
    }
  }

  edges.sort((a,b)=>
    (a.id0<b.id0||(a.id0===b.id0&&a.id1<b.id1))?-1:1
  );

  const neighbors = new Int32Array(3*numTris);
  neighbors.fill(-1);

  let nr=0;
  while(nr<edges.length){
    const e0=edges[nr++];
    if(nr<edges.length){
      const e1=edges[nr];
      if(e0.id0===e1.id0&&e0.id1===e1.id1){
        neighbors[e0.edgeNr]=e1.edgeNr;
        neighbors[e1.edgeNr]=e0.edgeNr;
      }
      nr++;
    }
  }

  return neighbors;
}

export class Cloth {
    constructor(mesh, scene, _texture, bendingCompliance = 1.0)
    {
        // particles

        this.numParticles = mesh.vertices.length / 3;
        this.pos = new Float32Array(mesh.vertices);
        this.prevPos = new Float32Array(mesh.vertices);
        this.restPos = new Float32Array(mesh.vertices);
        this.vel = new Float32Array(3 * this.numParticles);
        this.invMass = new Float32Array(this.numParticles);

        // stretching and bending constraints

        const neighbors = findTriNeighbors(mesh.faceTriIds);
        var numTris = mesh.faceTriIds.length / 3;
        var edgeIds = [];
        var triPairIds = [];

        for (var i = 0; i < numTris; i++) {
            for (var j = 0; j < 3; j++) {
                var id0 = mesh.faceTriIds[3 * i + j];
                var id1 = mesh.faceTriIds[3 * i + (j + 1) % 3];

                // each edge only once
                var n = neighbors[3 * i + j];
                if (n < 0 || id0 < id1) {
                    edgeIds.push(id0);
                    edgeIds.push(id1);
                }
                // tri pair
                if (n >= 0) {
                    // opposite ids
                    var ni = Math.floor(n / 3);
                    var nj = n % 3;
                    var id2 = mesh.faceTriIds[3 * i + (j + 2) % 3];
                    var id3 = mesh.faceTriIds[3 * ni + (nj + 2) % 3];
                    triPairIds.push(id0);
                    triPairIds.push(id1);
                    triPairIds.push(id2);
                    triPairIds.push(id3);
                }
            }
        }

        this.stretchingIds = new Int32Array(edgeIds);
        this.bendingIds = new Int32Array(triPairIds);
        this.stretchingLengths = new Float32Array(this.stretchingIds.length / 2);
        this.bendingLengths = new Float32Array(this.bendingIds.length / 4);

        this.stretchingCompliance = 0.0;		
        this.bendingCompliance = bendingCompliance;

        this.temp = new Float32Array(4 * 3);
        this.grads = new Float32Array(4 * 3);

        this.grabId = -1;
        this.grabInvMass = 0.0;

        this.initPhysics(mesh.faceTriIds);

        // visual edge mesh

        var geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
        geometry.setIndex(edgeIds);
        var lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000, linewidth: 2});
        this.edgeMesh = new THREE.LineSegments(geometry, lineMaterial);
        this.edgeMesh.visible = false;
        scene.add(this.edgeMesh);

        // visual tri mesh

        // --- Geometry ---
        geometry = new THREE.BufferGeometry();

        // positions
        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(this.pos, 3)
        );

        // triangles
        geometry.setIndex(mesh.faceTriIds);

        // normales (important pour MeshPhongMaterial)
        geometry.computeVertexNormals();


        // =====================================================
        // ✅ Génération automatique des UVs (OBLIGATOIRE texture)
        // =====================================================
        const vertexCount = this.pos.length / 3;
        const uvs = new Float32Array(vertexCount * 2);

        // échelle UV → contrôle le zoom de base
        const scale = 0.1;   // ↓ plus petit = plus zoomé / ↑ plus grand = plus répété

        for (let i = 0; i < vertexCount; i++) {
            const x = this.pos[i * 3];
            const y = this.pos[i * 3 + 1];

            uvs[i * 2]     = x * scale;
            uvs[i * 2 + 1] = y * scale;
        }

        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));


        // =====================================================
        // ✅ Texture
        // =====================================================
        this.texture = _texture;
        if (this.texture) {
            this.texture.wrapS = THREE.RepeatWrapping;
            this.texture.wrapT = THREE.RepeatWrapping;
            this.texture.repeat.set(350, 350);
        }


        // =====================================================
        // ✅ Matériau
        // =====================================================
        this.material = new THREE.MeshPhongMaterial({
            map: this.texture,
            side: THREE.DoubleSide
        });


        const shaderMaterial = getWeaveMaterial(this.material, gridSize.value, tileCount.value);


        // =====================================================
        // ✅ Mesh
        // =====================================================
        
        this.triMesh = new THREE.Mesh(geometry, shaderMaterial);
        this.triMesh.castShadow = true;
        this.triMesh.userData = this;
        this.triMesh.layers.enable(1);
        scene.add(this.triMesh);
        geometry.computeVertexNormals();
        
        this.updateMeshes();

        this.volIdOrder = [[1,3,2], [0,2,3], [0,3,1], [0,1,2]];
    }

    initPhysics(triIds) 
    {
        this.invMass.fill(0.0);

        var numTris = triIds.length / 3;
        var e0 = [0.0, 0.0, 0.0];
        var e1 = [0.0, 0.0, 0.0];
        var c = [0.0, 0.0, 0.0];

        for (var i = 0; i < numTris; i++) {
            var id0 = triIds[3 * i];
            var id1 = triIds[3 * i + 1];
            var id2 = triIds[3 * i + 2];
            vecSetDiff(e0,0, this.pos,id1, this.pos,id0);
            vecSetDiff(e1,0, this.pos,id2, this.pos,id0);
            vecSetCross(c,0, e0,0, e1,0);
            var A = 0.5 * Math.sqrt(vecLengthSquared(c,0));
            var pInvMass = A > 0.0 ? 1.0 / A / 3.0 : 0.0;
            this.invMass[id0] += pInvMass;
            this.invMass[id1] += pInvMass;
            this.invMass[id2] += pInvMass;
        }

        for (var i = 0; i < this.stretchingLengths.length; i++) {
            var id0 = this.stretchingIds[2 * i];
            var id1 = this.stretchingIds[2 * i + 1];
            this.stretchingLengths[i] = Math.sqrt(vecDistSquared(this.pos,id0, this.pos,id1));
        }

        for (var i = 0; i < this.bendingLengths.length; i++) {
            var id0 = this.bendingIds[4 * i + 2];
            var id1 = this.bendingIds[4 * i + 3];
            this.bendingLengths[i] = Math.sqrt(vecDistSquared(this.pos,id0, this.pos,id1));
        }

        // attach

        var minX = Number.MAX_VALUE;
        var maxX = -Number.MAX_VALUE;
        var maxY = -Number.MAX_VALUE;

        for (var i = 0; i < this.numParticles; i++) {
            minX = Math.min(minX, this.pos[3 * i]);
            maxX = Math.max(maxX, this.pos[3 * i]);
            maxY = Math.max(maxY, this.pos[3 * i + 1]);
        }
        var eps = 0.0001;

        for (var i = 0; i < this.numParticles; i++) {
            var x = this.pos[3 * i];
            var y = this.pos[3 * i + 1];
            if ((y > maxY - eps) && (x < minX + eps || x > maxX - eps))
                this.invMass[i] = 0.0;
        }
    }

    preSolve(dt, gravity)
    {
        for (var i = 0; i < this.numParticles; i++) {
            if (this.invMass[i] == 0.0)
                continue;
            vecAdd(this.vel,i, gravity,0, dt);
            vecCopy(this.prevPos,i, this.pos,i);
            vecAdd(this.pos,i, this.vel,i, dt);
            var y = this.pos[3 * i + 1];
            if (y < 0.0) {
                vecCopy(this.pos,i, this.prevPos,i);
                this.pos[3 * i + 1] = 0.0;
            }
        }
    }

    solve(dt)
    {
        this.solveStretching(this.stretchingCompliance, dt);
        this.solveBending(this.bendingCompliance, dt);
    }

    postSolve(dt)
    {
        for (var i = 0; i < this.numParticles; i++) {
            if (this.invMass[i] == 0.0)
                continue;
            vecSetDiff(this.vel,i, this.pos,i, this.prevPos,i, 1.0 / dt);
        }
    }

    solveStretching(compliance, dt) {
        var alpha = compliance / dt /dt;

        for (var i = 0; i < this.stretchingLengths.length; i++) {
            var id0 = this.stretchingIds[2 * i];
            var id1 = this.stretchingIds[2 * i + 1];
            var w0 = this.invMass[id0];
            var w1 = this.invMass[id1];
            var w = w0 + w1;
            if (w == 0.0)
                continue;

            vecSetDiff(this.grads,0, this.pos,id0, this.pos,id1);
            var len = Math.sqrt(vecLengthSquared(this.grads,0));
            if (len == 0.0)
                continue;
            vecScale(this.grads,0, 1.0 / len);
            var restLen = this.stretchingLengths[i];
            var C = len - restLen;
            var s = -C / (w + alpha);
            vecAdd(this.pos,id0, this.grads,0, s * w0);
            vecAdd(this.pos,id1, this.grads,0, -s * w1);
        }
    }

    solveBending(compliance, dt) {
        var alpha = compliance / dt /dt;

        for (var i = 0; i < this.bendingLengths.length; i++) {
            var id0 = this.bendingIds[4 * i + 2];
            var id1 = this.bendingIds[4 * i + 3];
            var w0 = this.invMass[id0];
            var w1 = this.invMass[id1];
            var w = w0 + w1;
            if (w == 0.0)
                continue;

            vecSetDiff(this.grads,0, this.pos,id0, this.pos,id1);
            var len = Math.sqrt(vecLengthSquared(this.grads,0));
            if (len == 0.0)
                continue;
            vecScale(this.grads,0, 1.0 / len);
            var restLen = this.bendingLengths[i];
            var C = len - restLen;
            var s = -C / (w + alpha);
            vecAdd(this.pos,id0, this.grads,0, s * w0);
            vecAdd(this.pos,id1, this.grads,0, -s * w1);
        }
    }

    updateMeshes() {
        this.triMesh.geometry.computeVertexNormals();
        this.triMesh.geometry.attributes.position.needsUpdate = true;
        this.triMesh.geometry.computeBoundingSphere();

        this.edgeMesh.geometry.attributes.position.needsUpdate = true;
    }

    endFrame() 
    {
        this.updateMeshes();
    }

    startGrab(pos) 
    {
        var p = [pos.x, pos.y, pos.z];
        var minD2 = Number.MAX_VALUE;
        this.grabId = -1;
        for (let i = 0; i < this.numParticles; i++) {
            var d2 = vecDistSquared(p,0, this.pos,i);
            if (d2 < minD2) {
                minD2 = d2;
                this.grabId = i;
            }
        }

        if (this.grabId >= 0) {
            this.grabInvMass = this.invMass[this.grabId];
            this.invMass[this.grabId] = 0.0;
            vecCopy(this.pos,this.grabId, p,0);	
        }
    }

    moveGrabbed(pos, vel) 
    {
        if (this.grabId >= 0) {
            var p = [pos.x, pos.y, pos.z];
            vecCopy(this.pos,this.grabId, p,0);
        }
    }

    endGrab(pos, vel) 
    {
        if (this.grabId >= 0) {
            this.invMass[this.grabId] = this.grabInvMass;
            var v = [vel.x, vel.y, vel.z];
            vecCopy(this.vel,this.grabId, v,0);
        }
        this.grabId = -1;
    }
}