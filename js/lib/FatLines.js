import {
  Color,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  Object3D,
  RGBAFormat,
  BufferGeometry, Float32BufferAttribute, MathUtils, Vector3, Triangle,

} from "./three.module.js";
import { LineMaterial } from "./jsm/lines/LineMaterial";
import { LineSegments2 } from "./jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "./jsm/lines/LineSegmentsGeometry";
import * as BufferGeometryUtils from "./jsm/utils/BufferGeometryUtils";
//import * as Utils from "../js/geometries/Utils";

class FatLinesBatch extends LineSegments2 {
  constructor(geometries) {
    super();
    this.thresholdAngle = { value: 0 };
    let edges = batchGeometries(geometries);
    this.colorIdx = edges.userData.colorIdx;
    let g = new LineSegmentsGeometry();
    g.setPositions(edges.attributes.position.array);
    g.setColors(
      new Float32Array(edges.attributes.position.array.length).fill(1)
    );
    g.setAttribute(
      "normal0",
      new InstancedBufferAttribute(edges.attributes.normal0.array, 3)
    );
    g.setAttribute(
      "normal1",
      new InstancedBufferAttribute(edges.attributes.normal1.array, 3)
    );
    g.setAttribute(
      "instIndex",
      new InstancedBufferAttribute(edges.attributes.instIdx.array, 1)
    );
    let m = new LineMaterial({
      linewidth: 0.05,
      worldUnits: false,
      vertexColors: true,
      alphaToCoverage: true,
      polygonOffset: true,
      polygonOffsetFactor: -10,
      onBeforeCompile: (shader) => {
        shader.uniforms.uMediator = this.uMediator;
        shader.uniforms.thresholdAngle = this.thresholdAngle;
        shader.vertexShader = `
          uniform sampler2D uMediator;
          uniform float thresholdAngle;
          attribute float instIndex;
          attribute vec3 normal0;
          attribute vec3 normal1;
          varying float vInstDiscard;
          ${shader.vertexShader}
        `
          .replace(
            `// camera space`,
            `// camera space
          vec4 row0 = texelFetch(uMediator, ivec2(0, int(instIndex)), 0);
          vec4 row1 = texelFetch(uMediator, ivec2(1, int(instIndex)), 0);
          vec4 row2 = texelFetch(uMediator, ivec2(2, int(instIndex)), 0);
          vec4 row3 = texelFetch(uMediator, ivec2(3, int(instIndex)), 0);
          mat4 instMatrix = mat4(row0, row1, row2, row3);
          `
          )
          .replaceAll(
            `= modelViewMatrix * vec4( instance`,
            `= modelViewMatrix * instMatrix * vec4( instance`
          )
          .replace(
            `#include <fog_vertex>`,
            `#include <fog_vertex>
            
            vec3 mp = (instanceStart + instanceEnd) / 2.;
            vec3 cp0 = mp + cross(normal0, normalize(instanceEnd - instanceStart));
            vec3 cp1 = mp + cross(normal1, normalize(instanceEnd - instanceStart));

            vec4 midEdge = projectionMatrix * modelViewMatrix * instMatrix * vec4(mp, 1.);
            vec4 c0edge = projectionMatrix * modelViewMatrix * instMatrix * vec4(cp0, 1.);
            vec4 c1edge = projectionMatrix * modelViewMatrix * instMatrix * vec4(cp1, 1.);

            vec2 me = midEdge.xy / midEdge.w;
            vec2 c0 = c0edge.xy / c0edge.w;
            vec2 c1 = c1edge.xy / c1edge.w;

            c0 = normalize(c0 - me);
            c1 = normalize(c1 - me);

            vec2 mdir = normalize(vec2(-dir.y, dir.x));

            float d0 = dot(mdir, c0);
            float d1 = dot(mdir, c1);

            bool type5  = sign( d0 ) != sign( d1 );
            bool threshold = dot(normal0, normal1) <= cos(thresholdAngle);

            vInstDiscard = float(type5 || threshold);
            `
          );
        //console.log(shader.vertexShader);
        shader.fragmentShader = `
            varying float vInstDiscard;
            ${shader.fragmentShader}
        `.replace(
          `#include <premultiplied_alpha_fragment>`,
          `#include <premultiplied_alpha_fragment>
            float instDiscard = vInstDiscard;
            if (instDiscard < 0.5) discard;
            
          `
        );
        //console.log(shader.fragmentShader);
      }
    });
    this.items = new Array(geometries.length).fill().map((_) => {
      return new Object3D();
    });

    this.geometry = g;
    this.material = m;


    let mediatorWidth = 4;
    let mediatorHeight = geometries.length;
    let mediator = new DataTexture(
      new Float32Array(mediatorWidth * mediatorHeight * 4),
      mediatorWidth,
      mediatorHeight,
      RGBAFormat,
      FloatType
    );
    this.uMediator = { value: mediator };

    this.update = () => {
      this.items.forEach((o, idx) => {
        o.updateMatrix();
        this.uMediator.value.image.data.set(o.matrix.elements, idx * 16);
      });
      this.uMediator.value.needsUpdate = true;
      this.material.resolution.set(window.innerWidth, window.innerHeight);
    };

    let _c = new Color();
    this.setColorAt = (idx, color) => {
      _c.set(color);
      let cStart = this.geometry.attributes["instanceColorStart"];
      let cEnd = this.geometry.attributes["instanceColorEnd"];
      let cIdx = this.colorIdx[idx];
      let cIdxStart = cIdx[0];
      let cIdxLength = cIdx[1];
      for (let i = cIdxStart; i < cIdxStart + cIdxLength; i++) {
        cStart.setXYZ(i, _c.r, _c.g, _c.b);
        cEnd.setXYZ(i, _c.r, _c.g, _c.b);
      }
      cStart.needsUpdate = true;
      cEnd.needsUpdate = true;
    };
  }
}
export { FatLinesBatch };






function batchGeometries(geometries) {
  let colorIdx = [];
  let colorIdxStart = 0;
  let gs = geometries.map((g, idx) => {
    let ng = new EdgesGeometryExt(g);
    let instIdx = [];
    for (let i = 0; i < ng.attributes.position.count / 2; i++) {
      instIdx.push(idx);
    }
    ng.setAttribute("instIdx", new Float32BufferAttribute(instIdx, 1));
    let iil = instIdx.length;
    colorIdx.push([colorIdxStart, iil]);
    colorIdxStart += iil;
    return ng;
  });
  let fg = BufferGeometryUtils.mergeBufferGeometries(gs);
  fg.userData.colorIdx = colorIdx;
  return fg;
}
export { batchGeometries };





const _v0 = /*@__PURE__*/ new Vector3();
const _v1 = /*@__PURE__*/ new Vector3();
const _normal = /*@__PURE__*/ new Vector3();
const _triangle = /*@__PURE__*/ new Triangle();

class EdgesGeometryExt extends BufferGeometry {
  constructor(geometry = null, thresholdAngle = 1) {
    super();

    this.type = "EdgesGeometry";

    this.parameters = {
      geometry: geometry,
      thresholdAngle: thresholdAngle
    };

    if (geometry !== null) {
      const precisionPoints = 4;
      const precision = Math.pow(10, precisionPoints);
      const thresholdDot = Math.cos(MathUtils.DEG2RAD * thresholdAngle);

      const indexAttr = geometry.getIndex();
      const positionAttr = geometry.getAttribute("position");
      const indexCount = indexAttr ? indexAttr.count : positionAttr.count;

      const indexArr = [0, 0, 0];
      const vertKeys = ["a", "b", "c"];
      const hashes = new Array(3);

      const edgeData = {};
      const vertices = [];
      const normal0 = [];
      const normal1 = [];
      for (let i = 0; i < indexCount; i += 3) {
        if (indexAttr) {
          indexArr[0] = indexAttr.getX(i);
          indexArr[1] = indexAttr.getX(i + 1);
          indexArr[2] = indexAttr.getX(i + 2);
        } else {
          indexArr[0] = i;
          indexArr[1] = i + 1;
          indexArr[2] = i + 2;
        }

        const { a, b, c } = _triangle;
        a.fromBufferAttribute(positionAttr, indexArr[0]);
        b.fromBufferAttribute(positionAttr, indexArr[1]);
        c.fromBufferAttribute(positionAttr, indexArr[2]);
        _triangle.getNormal(_normal);

        // create hashes for the edge from the vertices
        hashes[0] = `${Math.round(a.x * precision)},${Math.round(
          a.y * precision
        )},${Math.round(a.z * precision)}`;
        hashes[1] = `${Math.round(b.x * precision)},${Math.round(
          b.y * precision
        )},${Math.round(b.z * precision)}`;
        hashes[2] = `${Math.round(c.x * precision)},${Math.round(
          c.y * precision
        )},${Math.round(c.z * precision)}`;

        // skip degenerate triangles
        if (
          hashes[0] === hashes[1] ||
          hashes[1] === hashes[2] ||
          hashes[2] === hashes[0]
        ) {
          continue;
        }

        // iterate over every edge
        for (let j = 0; j < 3; j++) {
          // get the first and next vertex making up the edge
          const jNext = (j + 1) % 3;
          const vecHash0 = hashes[j];
          const vecHash1 = hashes[jNext];
          const v0 = _triangle[vertKeys[j]];
          const v1 = _triangle[vertKeys[jNext]];

          const hash = `${vecHash0}_${vecHash1}`;
          const reverseHash = `${vecHash1}_${vecHash0}`;

          if (reverseHash in edgeData && edgeData[reverseHash]) {
            // if we found a sibling edge add it into the vertex array if
            // it meets the angle threshold and delete the edge from the map.
            let edrhn = edgeData[reverseHash].normal;
            if (_normal.dot(edrhn) <= thresholdDot) {
              vertices.push(v0.x, v0.y, v0.z);
              vertices.push(v1.x, v1.y, v1.z);
              normal0.push(_normal.x, _normal.y, _normal.z);
              normal1.push(edrhn.x, edrhn.y, edrhn.z);
            }

            edgeData[reverseHash] = null;
          } else if (!(hash in edgeData)) {
            // if we've already got an edge here then skip adding a new one
            edgeData[hash] = {
              index0: indexArr[j],
              index1: indexArr[jNext],
              normal: _normal.clone()
            };
          }
        }
      }

      // iterate over all remaining, unmatched edges and add them to the vertex array
      for (const key in edgeData) {
        if (edgeData[key]) {
          const { index0, index1 } = edgeData[key];
          _v0.fromBufferAttribute(positionAttr, index0);
          _v1.fromBufferAttribute(positionAttr, index1);

          vertices.push(_v0.x, _v0.y, _v0.z);
          vertices.push(_v1.x, _v1.y, _v1.z);
          const n = edgeData[key].normal;
          normal0.push(n.x, n.y, n.z);
          normal1.push(n.x, n.y, n.z);
        }
      }

      this.setAttribute("position", new Float32BufferAttribute(vertices, 3));
      this.setAttribute("normal0", new Float32BufferAttribute(normal0, 3));
      this.setAttribute("normal1", new Float32BufferAttribute(normal1, 3));
    }
  }
}

//export { EdgesGeometryExt };