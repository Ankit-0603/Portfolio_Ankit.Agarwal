import { writeFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const avatar = new THREE.Group();
avatar.name = "Ankit_Avatar";
const V = (point) => new THREE.Vector3(...point);

function material(name, color, roughness = 0.7, metalness = 0) {
  return new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
}

const skin = material("Warm peach skin", 0xedaa87, 0.64);
const faceMaterial = skin.clone();
faceMaterial.vertexColors = true;
const earShade = material("Ear rose", 0xbd7763);
const upperLip = material("Upper lip", 0xad6654);
const lowerLip = material("Lower lip", 0xcd7e68);
const lipLine = material("Smile shadow", 0x6c3b32);
const hair = material("Black hair", 0x251f22, 0.39);
const hairLocks = hair.clone();
hairLocks.vertexColors = true;
const brow = material("Eyebrows and lashes", 0x362521);
const frames = material("Graphite acetate", 0x272832, 0.29, 0.12);
const hardware = material("Satin metal", 0x999aaa, 0.38, 0.48);
const eyeWhite = material("Warm ivory sclera", 0xf6e8da, 0.42);
const irisMaterial = material("Hazel iris", 0xffffff, 0.41);
irisMaterial.vertexColors = true;
const pupilMaterial = material("Pupil", 0x131016, 0.27);
const glint = new THREE.MeshBasicMaterial({ color: 0xfff1df, name: "Eye glint" });
const hoodie = material("Charcoal fleece", 0x41434d);
const seam = material("Fleece seams", 0x4d4e5c);
const collar = material("Hood lining and ribbed cuffs", 0x292a36);
const shirt = material("Midnight blue shirt", 0x252e53);
const headphones = material("Headphone shells", 0x353844, 0.36, 0.26);
const cushion = material("Headphone cushions", 0x24242c);
const accent = material("Periwinkle trim", 0xa6a6e8, 0.51, 0.14);
const denim = material("Indigo denim", 0x3b435c);
const shoe = material("Graphite sneakers", 0x3a3c4b);
const sole = material("Sneaker foxing", 0x858696);
const chair = material("Chair upholstery", 0x343148);
const chairInset = material("Chair inset", 0x4b4564);
const chairShell = material("Chair shell", 0x262532, 0.46);
const keyboard = material("Keyboard case", 0x303441, 0.46);
const keycap = material("Keyboard keys", 0x85869f);

function group(parent, name, [x, y, z] = [0, 0, 0]) {
  const node = new THREE.Group();
  node.name = name;
  node.position.set(x, y, z);
  parent.add(node);
  return node;
}

function mesh(parent, name, geometry, material, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.copy(V(position));
  parent.add(object);
  return object;
}

function ellipsoid(parent, name, material, position, scale, roll = 0) {
  const geometry = new THREE.SphereGeometry(1, 22, 14);
  geometry.scale(...scale);
  const object = mesh(parent, name, geometry, material, position);
  object.rotation.z = roll;
  return object;
}

function roundedBox(parent, name, material, position, size, rounding) {
  return mesh(parent, name, new RoundedBoxGeometry(...size, 3, rounding), material, position);
}

function geometry(positions, indices, colors) {
  const result = new THREE.BufferGeometry();
  result.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (colors) result.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  result.setIndex(indices);
  result.computeVertexNormals();
  return result;
}

function crossSection(sections, y) {
  const upper = sections.findIndex((section) => section[0] >= y);
  if (upper <= 0) return sections[upper < 0 ? sections.length - 1 : 0].slice(1);
  const a = sections[upper - 1];
  const b = sections[upper];
  const before = sections[Math.max(0, upper - 2)];
  const after = sections[Math.min(sections.length - 1, upper + 1)];
  const span = b[0] - a[0];
  const t = (y - a[0]) / span;
  return a.slice(1).map((value, offset) => {
    const i = offset + 1;
    const startSlope = (b[i] - before[i]) / (b[0] - before[0]);
    const endSlope = (after[i] - value) / (after[0] - a[0]);
    return THREE.MathUtils.lerp(value, b[i], t * t * (3 - 2 * t)) +
      span * t * (1 - t) * ((1 - t) * startSlope - t * endSlope);
  });
}

function loft(sections, { rings = 48, sides = 64, exponent = 1, surface } = {}) {
  const positions = [];
  const colors = [];
  const indices = [];
  const start = sections[0][0];
  const end = sections.at(-1)[0];
  for (let row = 0; row <= rings; row++) {
    const y = THREE.MathUtils.lerp(start, end, row / rings);
    const [width, depth, center] = crossSection(sections, y);
    for (let col = 0; col < sides; col++) {
      const theta = col / sides * Math.PI * 2;
      const sx = Math.sin(theta);
      const cz = Math.cos(theta);
      const x = Math.sign(sx) * Math.abs(sx) ** exponent * width;
      const z = center + Math.sign(cz) * Math.abs(cz) ** exponent * depth;
      const extra = surface?.(x, y, z, Math.max(0, cz));
      positions.push(x, y, z + (extra?.depth ?? 0));
      if (extra) colors.push(...extra.color);
      if (row < rings) {
        const a = row * sides + col;
        const b = row * sides + (col + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  const result = geometry(positions, indices, colors.length ? colors : undefined);
  return result;
}

function sweep(parent, name, material, points, widths, depths, {
  guide = () => new THREE.Vector3(0, 0, 1),
  segments = 24,
  sides = 12,
  grooves = false,
  closed = false,
} = {}) {
  const path = new THREE.CatmullRomCurve3(points.map(V), closed);
  const positions = [];
  const indices = [];
  const colors = [];
  const profile = (values, t) => {
    const index = t * (values.length - 1);
    return THREE.MathUtils.lerp(values[Math.floor(index)], values[Math.ceil(index)], index % 1);
  };
  for (let row = 0; row <= segments; row++) {
    const t = row / segments;
    const center = path.getPoint(t);
    const tangent = path.getTangent(t);
    const side = tangent.clone().cross(guide(center));
    if (side.lengthSq() < 0.0001) side.crossVectors(tangent, new THREE.Vector3(0, 1, 0));
    side.normalize();
    const outward = side.clone().cross(tangent).normalize();
    for (let col = 0; col < sides; col++) {
      const a = col / sides * Math.PI * 2;
      const ridge = grooves ? Math.cos(a * 6 + Math.sin(t * 5) * 0.8) : 0;
      const point = center.clone()
        .addScaledVector(side, Math.sin(a) * profile(widths, t))
        .addScaledVector(outward, Math.cos(a) * profile(depths, t) * (1 + ridge * 0.09));
      positions.push(...point);
      if (grooves) {
        const shade = 0.81 + ridge * 0.125 + 0.11 * Math.sin(t * Math.PI);
        colors.push(shade, shade, shade);
      }
      if (row < segments) {
        const vertex = row * sides + col;
        const next = row * sides + (col + 1) % sides;
        indices.push(vertex, next, vertex + sides, next, next + sides, vertex + sides);
      }
    }
  }
  return mesh(parent, name, geometry(positions, indices, grooves ? colors : undefined), material);
}

function line(parent, name, material, points, radius, closed = false) {
  return sweep(parent, name, material, points, [radius], [radius], { closed, segments: closed ? 48 : 18, sides: 8 });
}

const headSections = [
  [0.105, 0.018, 0.028, 0.18], [0.14, 0.18, 0.16, 0.158],
  [0.23, 0.34, 0.30, 0.10], [0.37, 0.453, 0.375, 0.06],
  [0.51, 0.529, 0.44, 0.038], [0.66, 0.552, 0.477, 0.023],
  [0.81, 0.553, 0.481, 0.011], [0.96, 0.536, 0.473, 0],
  [1.09, 0.472, 0.417, -0.023], [1.20, 0.343, 0.333, -0.035],
  [1.29, 0.175, 0.186, -0.045], [1.32, 0.008, 0.01, -0.05],
];
const faceExponent = 0.85;
function bump(x, y, cx, cy, width, height) {
  return Math.exp(-(((x - cx) / width) ** 2 + ((y - cy) / height) ** 2));
}

function faceDepth(x, y) {
  const side = Math.abs(x);
  return 0.060 * bump(side, y, 0.34, 0.53, 0.155, 0.14) -
    0.048 * bump(side, y, 0.23, 0.76, 0.145, 0.10) +
    0.090 * bump(x, y, 0, 0.657, 0.067, 0.200) +
    0.121 * bump(x, y, 0, 0.582, 0.103, 0.084) +
    0.040 * bump(side, y, 0.084, 0.553, 0.060, 0.058) +
    0.042 * bump(x, y, 0, 0.404, 0.20, 0.081) +
    0.041 * bump(x, y, 0, 0.254, 0.25, 0.095);
}

function frontOf(sections, x, y, exponent = 1) {
  const [width, depth, center] = crossSection(sections, y);
  const ratio = Math.min(1, Math.abs(x) / width) ** (1 / exponent);
  return center + depth * Math.sqrt(1 - ratio * ratio) ** exponent;
}

function frontOfFace(x, y) {
  const [, , center] = crossSection(headSections, y);
  const z = frontOf(headSections, x, y, faceExponent);
  const [, depth] = crossSection(headSections, y);
  return z + ((z - center) / depth) ** (1 / faceExponent) * faceDepth(x, y);
}

const body = group(avatar, "Seated_Body");
const neck = [[2.73, 0.17, 0.15, 0.035], [2.82, 0.225, 0.184, 0.027],
  [3.05, 0.218, 0.183, 0.01], [3.27, 0.235, 0.19, 0.025], [3.33, 0.052, 0.045, 0.04]];
mesh(body, "Neck", loft(neck, { rings: 24, sides: 32 }), skin);

const head = group(body, "Head", [0, 3.04, 0.025]);
mesh(head, "Sculpted face", loft(headSections, {
  rings: 90,
  sides: 112,
  exponent: faceExponent,
  surface(x, y, _z, front) {
    const blush = bump(Math.abs(x), y, 0.386, 0.55, 0.135, 0.13) * front;
    const underChin = bump(x, y, 0, 0.12, 0.5, 0.14) * 0.05;
    const shade = underChin + 0.15 * bump(Math.abs(x), y, 0.066, 0.53, 0.022, 0.012) * front;
    return {
      depth: faceDepth(x, y) * front,
      color: [1 - shade, 1 - blush * 0.15 - shade, 1 - blush * 0.13 - shade],
    };
  },
}), faceMaterial);

for (const sign of [-1, 1]) {
  ellipsoid(head, "Ear", skin, [sign * 0.535, 0.599, 0.012], [0.149, 0.207, 0.113], sign * -0.19);
  ellipsoid(head, "Ear bowl", earShade, [sign * 0.587, 0.601, 0.101], [0.078, 0.126, 0.025], sign * -0.20);
  sweep(head, "Ear helix", skin, [
    [sign * 0.559, 0.48, 0.106], [sign * 0.620, 0.518, 0.117], [sign * 0.650, 0.644, 0.105],
    [sign * 0.624, 0.719, 0.098], [sign * 0.571, 0.721, 0.091],
  ], [0.014, 0.028, 0.023, 0.013], [0.012, 0.023, 0.017, 0.01]);

}

function lip(name, material, lower, upper, relief) {
  const positions = [];
  const indices = [];
  const cols = 44;
  const rows = 7;
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= cols; col++) {
      const u = 2 * col / cols - 1;
      const ratio = row / rows;
      const taper = Math.max(0.012, Math.cos(u * Math.PI / 2)) ** 0.85;
      const x = u * 0.198;
      const y = 0.393 + 0.030 * u ** 2 + 0.006 * u +
        taper * THREE.MathUtils.lerp(lower, upper, ratio);
      const z = frontOfFace(x, y) + 0.003 + taper * (0.006 + relief * Math.sin(ratio * Math.PI));
      positions.push(x, y, z);
      const a = row * (cols + 1) + col;
      if (row < rows && col < cols) indices.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
    }
  }
  mesh(head, name, geometry(positions, indices), material);
}

lip("Upper lip", upperLip, 0.003, 0.020, 0.009);
lip("Lower lip", lowerLip, -0.032, -0.003, 0.016);
lip("Smile", lipLine, -0.004, 0.004, 0.004);

function eyeOutline(angle, radius = 1) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const height = sine > 0 ? 0.093 : 0.075;
  return [0.157 * cosine * radius, height * sine * (1 - 0.37 * Math.abs(cosine)) * radius + 0.015 * cosine * radius];
}

const eyeY = 0.748;
for (const [sign, side] of [[-1, "L"], [1, "R"]]) {
  const eyeX = sign * 0.235;
  const baseZ = frontOfFace(eyeX, eyeY);
  const eye = group(head, "Eye_" + side, [eyeX, eyeY, baseZ]);
  const eyeZ = (x, y, radius) => frontOfFace(eyeX + x, eyeY + y) - baseZ + 0.013 + (1 - radius ** 2) * 0.065;
  const positions = [0, 0, eyeZ(0, 0, 0)];
  const indices = [];
  const edge = [];
  const cols = 48;
  const rows = 8;
  for (let row = 1; row <= rows; row++) {
    for (let col = 0; col < cols; col++) {
      const radius = row / rows;
      const [rx, y] = eyeOutline(col / cols * 2 * Math.PI, radius);
      const x = rx * sign;
      const z = eyeZ(x, y, radius);
      positions.push(x, y, z);
      if (row === rows) edge.push([x, y, z + 0.004]);
      const a = (row - 1) * cols + col + 1;
      const b = (row - 1) * cols + (col + 1) % cols + 1;
      for (const face of row === 1 ? [[0, a, b]] : [[a - cols, a, b], [a - cols, b, b - cols]]) {
        indices.push(...(sign > 0 ? face : face.reverse()));
      }
    }
  }
  mesh(eye, "Almond sclera", geometry(positions, indices), eyeWhite);
  sweep(eye, "Upper lash line", brow, edge.slice(0, 25), [0.007, 0.014, 0.013, 0.006], [0.006, 0.009, 0.009, 0.006]);
  sweep(eye, "Lower eyelid", skin, edge.slice(24).concat([edge[0]]), [0.007, 0.012, 0.009], [0.006, 0.009, 0.006]);

  const iris = group(eye, "Iris_" + side, [0, 0.002, 0.080]);
  iris.rotation.y = -sign * 0.08;
  const irisPositions = [0, 0, 0.015];
  const irisColors = [0.08, 0.04, 0.02];
  const irisIndices = [];
  const palette = [0x2e241b, 0xa98355, 0x6b513c, 0x80664c, 0x342b23, 0x211c18].map((hex) => new THREE.Color(hex));
  for (let row = 1; row <= palette.length; row++) {
    for (let col = 0; col < cols; col++) {
      const a = col / cols * Math.PI * 2;
      const r = row / palette.length;
      irisPositions.push(0.070 * r * Math.cos(a), 0.069 * r * Math.sin(a), 0.015 * (1 - r * r));
      const grain = 0.84 + 0.10 * Math.sin(17 * a) + 0.07 * Math.cos(23 * a + row * 0.67);
      irisColors.push(...palette[row - 1].clone().multiplyScalar(grain));
      const p = (row - 1) * cols + col + 1;
      const q = (row - 1) * cols + (col + 1) % cols + 1;
      if (row === 1) irisIndices.push(0, p, q);
      else irisIndices.push(p - cols, p, q, p - cols, q, q - cols);
    }
  }
  mesh(iris, "Hazel iris", geometry(irisPositions, irisIndices, irisColors), irisMaterial);
  ellipsoid(iris, "Pupil", pupilMaterial, [0, 0, 0.013], [0.041, 0.043, 0.009]);
  ellipsoid(iris, "Key light reflection", glint, [-0.025, 0.030, 0.019], [0.010, 0.010, 0.004]);
  ellipsoid(iris, "Fill light reflection", glint, [0.029, -0.021, 0.014], [0.005, 0.005, 0.003]);

  const eyebrow = [[0.104, 0.886], [0.175, 0.908], [0.264, 0.916], [0.355, 0.90], [0.413, 0.865]]
    .map(([x, y]) => [x * sign, y, frontOfFace(x * sign, y) + 0.012]);
  sweep(head, "Sculpted eyebrow", brow, eyebrow, [0.018, 0.034, 0.036, 0.026, 0.003], [0.008, 0.017, 0.017, 0.01, 0.004]);

  const frame = [[0.066, 0.795, 0.601], [0.109, 0.844, 0.608], [0.268, 0.861, 0.563],
    [0.463, 0.835, 0.453], [0.465, 0.760, 0.453], [0.404, 0.642, 0.481],
    [0.283, 0.616, 0.552], [0.162, 0.633, 0.588], [0.097, 0.709, 0.606]]
    .map(([x, y, z]) => [x * sign, y, z]);
  sweep(head, "Soft-square glasses rim", frames, frame, [0.019, 0.023, 0.018, 0.016, 0.019], [0.016], { closed: true, segments: 60 });
  sweep(head, "Glasses temple", frames, [
    [sign * 0.458, 0.826, 0.457], [sign * 0.528, 0.800, 0.392],
    [sign * 0.558, 0.756, 0.200], [sign * 0.575, 0.718, 0.008],
  ], [0.020, 0.025, 0.015], [0.016]);
  ellipsoid(head, "Glasses hinge pin", hardware, [sign * 0.431, 0.830, 0.483], [0.014, 0.008, 0.007]);
}

sweep(head, "Glasses bridge", frames, [[-0.084, 0.776, 0.608], [-0.041, 0.796, 0.619],
  [0.040, 0.796, 0.619], [0.084, 0.776, 0.608]], [0.019, 0.022, 0.019], [0.016]);

const hairstyle = group(head, "Layered swept hair");
// The crown wraps around the skull and recedes above the temples.
{
  const sides = 88;
  const rings = 32;
  const positions = [];
  const indices = [];
  for (let row = 0; row <= rings; row++) {
    for (let col = 0; col < sides; col++) {
      const theta = col / sides * Math.PI * 2;
      const front = Math.max(0, Math.cos(theta));
      const length = 2.28 - 1.16 * front ** 1.7;
      const phi = THREE.MathUtils.lerp(length, 0.003, row / rings);
      const width = Math.sin(phi);
      positions.push(0.582 * width * Math.sin(theta), 0.81 + 0.60 * Math.cos(phi),
        -0.030 + 0.503 * width * Math.cos(theta));
      if (row < rings) {
        const a = row * sides + col;
        const b = row * sides + (col + 1) % sides;
        indices.push(a, b, a + sides, b, b + sides, a + sides);
      }
    }
  }
  mesh(hairstyle, "Hair foundation", geometry(positions, indices), hair);
}

function lock(points, width, thickness, profile = [0.53, 0.95, 1, 0.76, 0.35, 0.008]) {
  sweep(hairstyle, "Sculpted hair lock", hairLocks, points, profile.map((v) => v * width),
    profile.map((v) => v * thickness), {
      guide: (center) => center.clone().sub(new THREE.Vector3(0, 0.72, -0.015)).normalize(),
      grooves: true,
      segments: 30,
      sides: 34,
    });
}

for (const sign of [-1, 1]) {
  lock([[sign * 0.28, 1.26, -0.24], [sign * 0.49, 1.09, -0.29], [sign * 0.55, 0.82, -0.29],
    [sign * 0.60, 0.56, -0.26], [sign * 0.66, 0.42, -0.14]], 0.165, 0.068);
  lock([[sign * 0.37, 1.10, -0.35], [sign * 0.47, 0.80, -0.41], [sign * 0.51, 0.53, -0.39],
    [sign * 0.52, 0.38, -0.31], [sign * 0.64, 0.28, -0.27]], 0.155, 0.085);
  lock([[sign * 0.14, 1.09, -0.44], [sign * 0.28, 0.78, -0.50], [sign * 0.35, 0.48, -0.48],
    [sign * 0.37, 0.30, -0.41], [sign * 0.53, 0.18, -0.34]], 0.145, 0.074);
  lock([[sign * 0.22, 1.32, -0.10], [sign * 0.43, 1.23, -0.03], [sign * 0.55, 1.04, 0.02],
    [sign * 0.61, 0.90, 0.07], [sign * 0.67, 0.91, 0.12]], 0.15, 0.075);
  lock([[sign * 0.39, 1.20, 0.06], [sign * 0.52, 1.07, 0.12], [sign * 0.572, 0.93, 0.17],
    [sign * 0.56, 0.80, 0.20], [sign * 0.52, 0.74, 0.255]], 0.14, 0.068);
}
lock([[0.22, 1.34, -0.10], [0.05, 1.47, -0.040], [-0.21, 1.45, -0.012],
  [-0.41, 1.37, 0.016], [-0.54, 1.40, 0.01]], 0.138, 0.062);
lock([[0.29, 1.33, 0.05], [0.10, 1.45, 0.13], [-0.17, 1.43, 0.17],
  [-0.42, 1.32, 0.19], [-0.61, 1.30, 0.15]], 0.150, 0.071);
lock([[0.20, 1.36, 0.25], [0.08, 1.42, 0.34], [-0.21, 1.35, 0.38],
  [-0.43, 1.19, 0.32], [-0.65, 1.15, 0.232]], 0.159, 0.068);
lock([[0.31, 1.34, 0.14], [0.46, 1.28, 0.17], [0.55, 1.16, 0.16],
  [0.63, 1.09, 0.15], [0.68, 1.11, 0.11]], 0.118, 0.064);
lock([[0.12, 1.31, 0.29], [-0.10, 1.31, 0.427], [-0.29, 1.22, 0.441],
  [-0.39, 1.07, 0.389], [-0.56, 0.97, 0.28]], 0.149, 0.072);
lock([[0.17, 1.31, 0.25], [0.03, 1.30, 0.409], [-0.16, 1.219, 0.495],
  [-0.24, 1.044, 0.475], [-0.40, 0.887, 0.408]], 0.131, 0.067);
lock([[0.288, 1.325, 0.21], [0.20, 1.27, 0.42], [0.084, 1.146, 0.502],
  [-0.028, 0.986, 0.477], [-0.137, 0.852, 0.486]], 0.138, 0.074);
lock([[0.23, 1.398, 0.11], [0.33, 1.36, 0.27], [0.29, 1.225, 0.438],
  [0.16, 1.129, 0.500], [0.042, 1.094, 0.506]], 0.110, 0.070);
lock([[0.32, 1.34, 0.16], [0.42, 1.26, 0.33], [0.45, 1.12, 0.371],
  [0.47, 0.978, 0.33], [0.51, 0.872, 0.287]], 0.109, 0.062);
lock([[0.11, 1.401, -0.127], [0.21, 1.477, -0.081], [0.31, 1.456, 0.062],
  [0.36, 1.37, 0.16], [0.45, 1.374, 0.18]], 0.077, 0.060);

const torsoSections = [
  [1.49, 0.006, 0.006, -0.010], [1.55, 0.36, 0.22, -0.005],
  [1.65, 0.55, 0.29, 0], [1.84, 0.56, 0.30, -0.014],
  [2.12, 0.57, 0.30, -0.025], [2.42, 0.626, 0.329, -0.047],
  [2.65, 0.676, 0.314, -0.067], [2.78, 0.60, 0.275, -0.069],
  [2.88, 0.45, 0.229, -0.075], [2.95, 0.26, 0.20, -0.067],
  [2.99, 0.05, 0.04, -0.064],
];
mesh(body, "Sculpted hoodie", loft(torsoSections, { exponent: 0.82 }), hoodie);
const torsoFront = (x, y) => frontOf(torsoSections, x, y, 0.82);
const zipperPoints = [[2.93, 0.24], [2.79, 0.247], [2.57, 0.18], [2.38, 0.111],
  [2.22, 0.048], [2.14, 0.020], [1.65, 0.020]];
{
  const positions = [];
  const indices = [];
  const rows = 26;
  const columns = 18;
  const top = 2.915;
  const opening = [...zipperPoints].reverse();
  for (let row = 0; row <= rows; row++) {
    const y = THREE.MathUtils.lerp(2.14, top, row / rows);
    const [width] = crossSection(opening, y);
    for (let col = 0; col <= columns; col++) {
      const x = width * (2 * col / columns - 1);
      positions.push(x, y, torsoFront(x, y) + 0.016);
      const a = row * (columns + 1) + col;
      if (row < rows && col < columns) indices.push(a, a + 1, a + columns + 1,
        a + 1, a + columns + 2, a + columns + 1);
    }
  }
  mesh(body, "Navy shirt in hoodie opening", geometry(positions, indices), shirt);
}
for (const sign of [-1, 1]) {
  const zip = zipperPoints.map(([y, width]) => [width * sign, y, torsoFront(width, y) + 0.023]);
  line(body, "Zipper tape", collar, zip, 0.026);
  line(body, "Zipper edge", hardware, zip.map(([x, y, z]) => [x, y, z + 0.017]), 0.008);
  sweep(body, "Folded hood", hoodie, [
    [sign * 0.19, 2.98, -0.255], [sign * 0.35, 3.013, -0.19],
    [sign * 0.418, 2.938, 0.002], [sign * 0.36, 2.836, 0.18], [sign * 0.266, 2.704, 0.245],
  ], [0.074, 0.112, 0.090, 0.072, 0.020], [0.078, 0.091, 0.095, 0.068, 0.025],
  { guide: () => new THREE.Vector3(0, 1, 0) });
  line(body, "Gray hood drawstring", seam, [[sign * 0.309, 2.733, 0.240], [sign * 0.306, 2.552, 0.305],
    [sign * 0.317, 2.329, 0.294], [sign * 0.31, 2.218, 0.282]], 0.012);
  line(body, "Drawstring tip", hardware, [[sign * 0.31, 2.224, 0.282], [sign * 0.308, 2.183, 0.282]], 0.010);
  const pocket = [[0.155, 1.91], [0.373, 1.91], [0.445, 1.825], [0.451, 1.732], [0.162, 1.705]];
  line(body, "Hoodie pocket stitching", seam, pocket.map(([x, y]) => [x * sign, y, torsoFront(x, y) + 0.013]),
    0.011, true);
}
roundedBox(body, "Zip pull", hardware, [0, 2.148, 0.309], [0.044, 0.080, 0.024], 0.008);
ellipsoid(body, "Hood back", collar, [0, 2.844, -0.266], [0.393, 0.227, 0.194]);

const glyphs = {
  A: [[[0, 0], [0.49, 1], [1, 0]], [[0.22, 0.38], [0.78, 0.38]]],
  I: [[[0.50, 0], [0.50, 1]]],
  D: [[[0.03, 0], [0.03, 1], [0.50, 1], [0.93, 0.74], [0.93, 0.25], [0.50, 0], [0.03, 0]]],
  E: [[[0.95, 0], [0.06, 0], [0.06, 1], [0.95, 1]], [[0.06, 0.51], [0.75, 0.51]]],
  V: [[[0.04, 1], [0.51, 0], [0.97, 1]]],
};
const badge = roundedBox(body, "AI DEV chest patch", collar, [0.398, 2.431, 0.21], [0.199, 0.182, 0.028], 0.016);
badge.rotation.y = 0.35;
for (const [word, x, y, width, height, spacing] of [
  ["AI", 0.345, 2.451, 0.058, 0.054, 0.072], ["DEV", 0.322, 2.379, 0.040, 0.041, 0.051],
]) {
  [...word].forEach((letter, index) => {
    for (const stroke of glyphs[letter]) {
      line(body, letter, accent, stroke.map(([u, v]) => {
        const px = x + index * spacing + width * u;
        return [px, y + height * v, 0.235 - (px - 0.395) * 0.35];
      }), 0.0058);
    }
  });
}

line(body, "Headphone headband", headphones, [
  [-0.237, 2.832, 0.192], [-0.288, 2.914, 0.071], [-0.247, 2.979, -0.121],
  [0, 3.00, -0.196], [0.247, 2.979, -0.121], [0.288, 2.914, 0.071], [0.237, 2.832, 0.192],
], 0.032);
for (const sign of [-1, 1]) {
  const earcup = group(body, "Resting headphone earcup", [sign * 0.245, 2.769, 0.246]);
  earcup.rotation.set(-0.18, sign * 0.46, sign * 0.22);
  ellipsoid(earcup, "Soft ear cushion", cushion, [0, 0, -0.018], [0.106, 0.135, 0.064]);
  ellipsoid(earcup, "Earcup metallic rim", hardware, [0, 0, 0.012], [0.094, 0.119, 0.045]);
  ellipsoid(earcup, "Earcup satin shell", headphones, [0, 0, 0.026], [0.089, 0.109, 0.045]);
  ellipsoid(earcup, "Periwinkle earcup marking", accent, [0, 0.003, 0.071], [0.017, 0.016, 0.003]);
}

const deskChair = group(avatar, "Desk_Chair");
const back = roundedBox(deskChair, "Outer backrest", chairShell, [0, 2.375, -0.382],
  [1.64, 1.81, 0.26], 0.22);
back.rotation.x = -0.10;
const backPad = roundedBox(deskChair, "Padded backrest", chair, [0, 2.387, -0.217],
  [1.54, 1.69, 0.18], 0.15);
backPad.rotation.x = -0.10;
roundedBox(deskChair, "Backrest head cushion", chairInset, [0, 3.091, -0.231], [0.89, 0.27, 0.17], 0.082);
for (const sign of [-1, 1]) {
  sweep(deskChair, "Backrest side bolster", chairInset, [
    [sign * 0.53, 3.102, -0.26], [sign * 0.715, 2.922, -0.177], [sign * 0.714, 2.65, -0.125],
    [sign * 0.661, 2.15, -0.088], [sign * 0.599, 1.699, -0.057],
  ], [0.029, 0.105, 0.108, 0.086, 0.04], [0.031, 0.098, 0.111, 0.09, 0.038]);
  line(deskChair, "Periwinkle backrest welt", accent, [
    [sign * 0.51, 3.186, -0.249], [sign * 0.736, 3.016, -0.217], [sign * 0.812, 2.724, -0.142],
    [sign * 0.77, 2.367, -0.102], [sign * 0.694, 2.033, -0.048],
  ], 0.012);
  line(deskChair, "Armrest support", chairShell, [
    [sign * 0.636, 1.361, -0.068], [sign * 0.905, 1.448, 0.002],
    [sign * 0.951, 1.66, 0.087], [sign * 0.951, 1.845, 0.223],
  ], 0.043);
  roundedBox(deskChair, "Padded armrest", chairInset, [sign * 0.944, 1.872, 0.199], [0.207, 0.115, 0.637], 0.051);
}
roundedBox(deskChair, "Seat shell", chairShell, [0, 1.381, 0.133], [1.67, 0.145, 1.28], 0.070);
roundedBox(deskChair, "Seat cushion", chair, [0, 1.499, 0.149], [1.62, 0.209, 1.22], 0.102);
mesh(deskChair, "Swivel column", new THREE.CylinderGeometry(0.077, 0.096, 1.09, 20),
  chairShell, [0, 0.782, -0.078]);
mesh(deskChair, "Seat lift accent", new THREE.CylinderGeometry(0.083, 0.083, 0.194, 20),
  hardware, [0, 0.959, -0.078]);
for (let index = 0; index < 5; index++) {
  const angle = (index / 5 + 0.055) * Math.PI * 2;
  const base = group(deskChair, "Caster", [0, 0, -0.078]);
  base.rotation.y = angle;
  line(base, "Swivel base spoke", chairShell, [[0, 0.252, 0], [0, 0.19, 0.30], [0, 0.136, 0.65]], 0.049);
  const wheel = mesh(base, "Caster wheel", new THREE.CylinderGeometry(0.066, 0.066, 0.075, 18),
    chairShell, [0, 0.077, 0.665]);
  wheel.rotation.z = Math.PI / 2;
}

for (const [sign, side] of [[-1, "L"], [1, "R"]]) {
  sweep(body, "Seated denim leg", denim, [[sign * 0.253, 1.665, -0.14], [sign * 0.306, 1.61, 0.19],
    [sign * 0.362, 1.492, 0.62], [sign * 0.392, 1.336, 0.865], [sign * 0.406, 0.987, 0.865],
    [sign * 0.424, 0.559, 0.815], [sign * 0.434, 0.29, 0.805]],
  [0.211, 0.221, 0.194, 0.173, 0.150, 0.139, 0.112],
  [0.175, 0.187, 0.177, 0.165, 0.143, 0.126, 0.108], {
    guide: () => new THREE.Vector3(0, 0.57, 0.8), segments: 44, sides: 28,
  });
  const sneaker = group(body, "Sneaker_" + side, [sign * 0.433, 0.14, 0.91]);
  sneaker.rotation.y = sign * 0.14;
  roundedBox(sneaker, "Sneaker sole", sole, [0, -0.04, 0.038], [0.314, 0.102, 0.546], 0.050);
  ellipsoid(sneaker, "Sneaker upper", shoe, [0, 0.029, 0.046], [0.146, 0.133, 0.253]);
  ellipsoid(sneaker, "Sneaker collar", shoe, [0, 0.099, -0.082], [0.125, 0.142, 0.137]);
  for (let index = 0; index < 4; index++) {
    const z = 0.033 + index * 0.043;
    const y = 0.159 - index * 0.010;
    line(sneaker, "Sneaker lace", sole, [[-0.06, y - 0.005, z], [0, y, z + 0.008], [0.06, y - 0.005, z + 0.012]], 0.009);
  }

  sweep(body, "Tapered hoodie sleeve", hoodie, [[sign * 0.498, 2.654, -0.060], [sign * 0.646, 2.482, -0.055],
    [sign * 0.744, 2.181, 0.002], [sign * 0.779, 1.935, 0.137], [sign * 0.653, 1.809, 0.392],
    [sign * 0.465, 1.805, 0.653]],
  [0.163, 0.225, 0.186, 0.163, 0.144, 0.102], [0.154, 0.207, 0.171, 0.157, 0.120, 0.085], {
    guide: () => new THREE.Vector3(0, 0.4, 1), segments: 36, sides: 24,
  });
  sweep(body, "Sleeve cuff", collar, [[sign * 0.517, 1.804, 0.595], [sign * 0.476, 1.802, 0.646],
    [sign * 0.440, 1.804, 0.692]], [0.112, 0.114, 0.101], [0.093, 0.093, 0.081],
  { guide: () => new THREE.Vector3(0, 1, 0) });
  const hand = group(body, "Hand_" + side, [sign * 0.442, 1.793, 0.688]);
  hand.rotation.y = -sign * 0.40;
  ellipsoid(hand, "Palm", skin, [0, 0.013, 0.089], [0.102, 0.059, 0.142]);
  // Place each pivot at its knuckle so the palm stays planted as a fingertip presses a key.
  for (const [index, name] of ["Index", "Middle", "Ring", "Pinky"].entries()) {
    const x = sign * (index - 1.50) * 0.045;
    const length = [0.114, 0.137, 0.130, 0.100][index];
    const finger = group(hand, name + "_" + side, [x, 0.023, 0.141]);
    sweep(finger, name, skin, [[0, 0, 0], [x * 0.10, 0.010, 0.036],
      [x * 0.15, -0.007, 0.043 + length * 0.55], [x * 0.18, -0.042, 0.004 + length]],
    [0.024, 0.023, 0.019, 0.006], [0.019, 0.022, 0.017, 0.006],
    { guide: () => new THREE.Vector3(0, 1, 0), segments: 14, sides: 8 });
  }
  const thumb = group(hand, "Thumb_" + side, [sign * -0.059, 0.008, 0.065]);
  sweep(thumb, "Thumb tip", skin, [[0, 0, 0], [sign * -0.044, 0.002, 0.033],
    [sign * -0.056, -0.007, 0.092], [sign * -0.042, -0.025, 0.121]],
  [0.034, 0.034, 0.024, 0.006], [0.026, 0.026, 0.021, 0.006],
  { guide: () => new THREE.Vector3(0, 1, 0), segments: 12, sides: 8 });
}

roundedBox(body, "Compact mechanical keyboard", keyboard, [0, 1.693, 0.909], [0.942, 0.055, 0.325], 0.024);
roundedBox(body, "Keyboard front trim", accent, [0, 1.693, 1.072], [0.855, 0.013, 0.009], 0.004);
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 13; col++) {
    if (row === 3 && col > 3 && col < 9) continue;
    roundedBox(body, "Keycap", row === 0 && col === 0 ? accent : keycap,
      [(col - 6) * 0.067, 1.726, 0.806 + row * 0.062], [0.057, 0.023, 0.048], 0.007);
  }
}
roundedBox(body, "Spacebar", keycap, [0, 1.726, 0.992], [0.322, 0.023, 0.048], 0.007);

// The keyboard already sits under the avatar's hands. Build the desktop up to its underside.
const workstation = group(avatar, "Workstation");
const enamel = material("Mist enamel", 0xb4b3c8, 0.47, 0.18);
const alloy = material("Anodized violet aluminum", 0x827993, 0.43, 0.36);
const graphite = material("Graphite powder coat", 0x343440, 0.52, 0.30);
const rubber = material("Rubber feet and vents", 0x22222d);
roundedBox(workstation, "Desktop", enamel, [0, 1.622, 1.19], [2.48, 0.086, 1.16], 0.033);
roundedBox(workstation, "Desktop lower edge", alloy, [0, 1.576, 1.19], [2.43, 0.030, 1.12], 0.014);
for (const x of [-1.03, 1.03]) {
  roundedBox(workstation, "Desk column", graphite, [x, 0.813, 1.27], [0.102, 1.51, 0.145], 0.018);
  roundedBox(workstation, "Desk foot", alloy, [x, 0.074, 1.23], [0.147, 0.070, 0.94], 0.031);
  for (const z of [0.85, 1.61]) {
    roundedBox(workstation, "Leveling pad", rubber, [x, 0.036, z], [0.114, 0.033, 0.10], 0.014);
  }
}
roundedBox(workstation, "Monitor base", alloy, [0.31, 1.692, 1.56], [0.56, 0.050, 0.35], 0.023);
roundedBox(workstation, "Monitor arm", alloy, [0.31, 2.014, 1.57], [0.15, 0.61, 0.087], 0.032);
const display = group(workstation, "Display", [0.31, 2.572, 1.54]);
display.rotation.x = 0.055;
const displayShell = material("Mulberry monitor shell", 0xa080a1, 0.38, 0.33);
roundedBox(display, "Monitor housing", displayShell, [0, 0, 0], [1.49, 0.90, 0.088], 0.042);
roundedBox(display, "Bezel", rubber, [0, 0, -0.041], [1.47, 0.88, 0.028], 0.012);
const glass = material("Screen", 0x1e2334, 0.32);
glass.emissive.setHex(0x20243c);
roundedBox(display, "Active screen", glass, [0, 0.009, -0.057], [1.40, 0.805, 0.014], 0.006);
roundedBox(display, "Stand mount", graphite, [0, -0.14, 0.057], [0.25, 0.27, 0.050], 0.022);
for (let vent = 0; vent < 12; vent++) {
  roundedBox(display, "Rear cooling vent", rubber, [(vent - 5.5) * 0.052, 0.28, 0.045],
    [0.032, 0.011, 0.008], 0.003);
}

function typingTrack(side, yaw, times, pitches) {
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler(0, yaw, 0);
  const values = pitches.flatMap((pitch) => {
    euler.x = pitch * 0.40;
    return rotation.setFromEuler(euler).toArray();
  });
  return new THREE.QuaternionKeyframeTrack("Hand_" + side + ".quaternion", times, values);
}

// Press times interleave across hands. Each keystroke has a lift, contact and release.
const strokeTimes = {
  Index_L: [0.16, 0.86, 1.51, 2.22], Middle_L: [0.40, 1.12, 1.79],
  Ring_L: [0.64, 1.92], Pinky_L: [1.36], Thumb_L: [0.99, 2.09],
  Index_R: [0.27, 0.92, 1.62, 2.13], Middle_R: [0.53, 1.29, 1.98],
  Ring_R: [0.75, 1.72], Pinky_R: [1.44, 2.26], Thumb_R: [0.12, 1.19],
};
function fingerTrack(joint, presses) {
  const times = [0];
  const pitches = [-0.12];
  for (const press of presses) {
    times.push(press - 0.10, press - 0.045, press, press + 0.085);
    pitches.push(-0.12, -0.40, 0.29, -0.12);
  }
  times.push(2.4);
  pitches.push(-0.12);
  const rotation = new THREE.Quaternion();
  const axis = new THREE.Vector3(1, 0, 0);
  return new THREE.QuaternionKeyframeTrack(joint + ".quaternion", times,
    pitches.flatMap((pitch) => rotation.setFromAxisAngle(axis, pitch).toArray()));
}

const typing = new THREE.AnimationClip("Typing", 2.4, [
  typingTrack("L", 0.4,
    [0, 0.18, 0.31, 0.48, 0.66, 0.97, 1.23, 1.36, 1.55, 1.72, 1.96, 2.19, 2.4],
    [0, 0.085, 0.006, 0.117, 0.034, -0.021, 0.09, 0.022, 0.092, 0.015, -0.034, 0.048, 0]),
  typingTrack("R", -0.4,
    [0, 0.12, 0.38, 0.56, 0.72, 0.84, 1.03, 1.26, 1.50, 1.67, 1.82, 2.02, 2.4],
    [0, -0.024, 0.08, 0.019, 0.106, 0.025, 0.102, 0.019, -0.036, 0.078, 0.017, 0.092, 0]),
  ...Object.entries(strokeTimes).map(([joint, times]) => fingerTrack(joint, times)),
]);

// Batch the parts that share a material, while keeping the gaze and hand joints independent.
function batchMeshes(parent) {
  const batches = new Map();
  for (const object of [...parent.children]) {
    if (!object.isMesh) {
      batchMeshes(object);
      continue;
    }
    object.geometry.deleteAttribute("uv");
    if (!object.geometry.index) object.geometry = mergeVertices(object.geometry);
    const key = object.material.uuid;
    const members = batches.get(key) ?? [];
    members.push(object);
    batches.set(key, members);
  }
  for (const members of batches.values()) {
    if (members.length < 2) continue;
    const geometries = members.map((object) => {
      object.updateMatrix();
      return object.geometry.applyMatrix4(object.matrix);
    });
    mesh(parent, members[0].material.name, mergeGeometries(geometries), members[0].material);
    parent.remove(...members);
  }
}

batchMeshes(avatar);

// Three's exporter uses FileReader to pack the GLB binary in the browser.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    void blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
};

const glb = await new GLTFExporter().parseAsync(avatar, { binary: true, animations: [typing] });
const output = new URL("../public/models/ankit-avatar.glb", import.meta.url);
await writeFile(output, Buffer.from(glb));
console.log(`Wrote ${output.pathname} (${Math.round(glb.byteLength / 1024)} KiB)`);
