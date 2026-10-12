// 沙画实验的独立渲染。颗粒邻域搜索与高度场照明思路参考 Sandboard：
// https://github.com/scottstts/Sandboard/tree/489cb01e81b11ba575887f7c76760498eb41aaa8/src/render
// 本实验使用独立的整数散列、抗锯齿颗粒和透光模型；遵循项目 LICENSE（GPL-3.0）。
import { GRID_HEIGHT, GRID_WIDTH, clamp, toolCodes } from './model'
import type { ArtRenderOptions } from './model'
import type { AirborneSand } from './airborne'

export const artRenderShader = /* wgsl */ `
struct View {
  grid: vec4f,
  controls: vec4f,
  cursor: vec4f,
  tool: vec4f,
  pour: vec4f,
}
@group(0) @binding(0) var<uniform> view: View;
@group(0) @binding(1) var<storage, read> sand: array<vec4f>;

struct VertexResult {
  @builtin(position) clip: vec4f,
  @location(0) uv: vec2f,
}
@vertex fn vertex(@builtin(vertex_index) vertexId: u32) -> VertexResult {
  let point = vec2f(f32((vertexId << 1u) & 2u), f32(vertexId & 2u));
  var result: VertexResult;
  result.clip = vec4f(point * 2.0 - 1.0, 0.0, 1.0);
  result.uv = vec2f(point.x, 1.0 - point.y);
  return result;
}

fn cellAt(cell: vec2i) -> vec4f {
  let bounded = clamp(cell, vec2i(0), vec2i(view.grid.xy) - vec2i(1));
  return sand[u32(bounded.y) * u32(view.grid.x) + u32(bounded.x)];
}
fn stateAt(point: vec2f) -> vec4f {
  let lattice = point - 0.5;
  let cell = vec2i(floor(lattice));
  let fraction = fract(lattice);
  return mix(mix(cellAt(cell), cellAt(cell + vec2i(1, 0)), fraction.x),
    mix(cellAt(cell + vec2i(0, 1)), cellAt(cell + vec2i(1, 1)), fraction.x), fraction.y);
}
// 不使用大坐标上的浮点 fract/hash：其精度丢失曾造成有方向的织物纹理。
fn avalanche(bits: u32) -> u32 {
  var value = bits;
  value = (value ^ (value >> 16u)) * 0x7feb352du;
  value = (value ^ (value >> 15u)) * 0x846ca68bu;
  return value ^ (value >> 16u);
}
fn hash2(cell: vec2i) -> vec2f {
  let bits = bitcast<vec2u>(cell);
  let combined = (bits.x * 0x9e3779b9u) ^ (bits.y * 0x85ebca6bu);
  return vec2f(f32(avalanche(combined) >> 8u), f32(avalanche(combined ^ 0xc2b2ae35u) >> 8u)) / 16777216.0;
}
fn softNoise(point: vec2f) -> f32 {
  let tile = vec2i(floor(point));
  let fraction = fract(point);
  let blend = fraction * fraction * (3.0 - 2.0 * fraction);
  return mix(mix(hash2(tile).x, hash2(tile + vec2i(1, 0)).x, blend.x),
    mix(hash2(tile + vec2i(0, 1)).x, hash2(tile + vec2i(1, 1)).x, blend.x), blend.y);
}

// 固定在沙床坐标上的椭圆颗粒：颜色、朝向与凹凸来自同一颗粒，避免逐像素白噪声。
struct Grain {
  pigment: f32,
  mineral: f32,
  seam: f32,
  coverage: f32,
  slope: vec2f,
  detail: f32,
}
fn grainAt(point: vec2f) -> Grain {
  // 旋转颗粒域；大、小两层保持空间一致。缩小时按照像素覆盖面积减弱微法线。
  let rotated = vec2f(dot(point, vec2f(0.9135, -0.4067)), dot(point, vec2f(0.4067, 0.9135)));
  let coordinate = rotated * 0.91;
  let tile = vec2i(floor(coordinate));
  let footprint = max(length(fwidth(coordinate)), 0.01);
  let resolved = 1.0 - smoothstep(0.75, 2.0, footprint);
  var closest = 100.0;
  var nextClosest = 100.0;
  var selectedSeed = vec2f(0.5);
  var selectedSlope = vec2f(0.0);
  for (var row = -1; row <= 1; row++) {
    for (var column = -1; column <= 1; column++) {
      let candidate = tile + vec2i(column, row);
      let seed = hash2(candidate);
      let offset = coordinate - vec2f(candidate) - 0.04 - seed * 0.92;
      let axis = normalize(hash2(candidate + vec2i(7919, 3271)) * 2.0 - 1.0 + 0.0001);
      let side = vec2f(-axis.y, axis.x);
      let aspect = 0.66 + seed.y * 0.72;
      let local = vec2f(dot(offset, axis) / aspect, dot(offset, side) * aspect);
      let squared = dot(local, local);
      if (squared < closest) {
        nextClosest = closest;
        closest = squared;
        selectedSeed = hash2(candidate + vec2i(71, 93));
        selectedSlope = axis * local.x / aspect + side * local.y * aspect;
      } else {
        nextClosest = min(nextClosest, squared);
      }
    }
  }
  let boundary = sqrt(nextClosest) - sqrt(closest);
  let seam = smoothstep(0.012, 0.12 + footprint * 0.035, boundary);
  let radius = 0.24 + selectedSeed.y * 0.22;
  let edgeAA = footprint * 0.20;
  let coverage = 1.0 - smoothstep(radius - edgeAA, radius + edgeAA, sqrt(closest));
  let microDetail = softNoise(rotated * 2.73 + vec2f(193.7, 89.1));
  let pigment = mix(0.5, selectedSeed.x, resolved);
  // 将颗粒局部法线转回沙盘坐标，否则高光会和宏观阴影方向不一致。
  let slope = vec2f(dot(selectedSlope, vec2f(0.9135, 0.4067)), dot(selectedSlope, vec2f(-0.4067, 0.9135)));
  return Grain(pigment, selectedSeed.y, seam, coverage, slope * resolved, mix(0.5, microDetail, resolved));
}

struct Light {
  direction: vec3f,
  key: vec3f,
  sky: vec3f,
  lamp: vec3f,
}
fn sceneLight() -> Light {
  if (view.grid.w > 1.5) {
    return Light(normalize(vec3f(0.58, -0.38, 0.52)), vec3f(0.36, 0.61, 1.05),
      vec3f(0.13, 0.23, 0.42), vec3f(0.77, 0.89, 1.0));
  }
  if (view.grid.w > 0.5) {
    return Light(normalize(vec3f(-0.84, -0.37, 0.43)), vec3f(1.07, 0.78, 0.47),
      vec3f(0.31, 0.27, 0.23), vec3f(1.0, 0.79, 0.48));
  }
  return Light(normalize(vec3f(-0.59, -0.50, 0.56)), vec3f(1.14, 1.06, 0.94),
    vec3f(0.28, 0.30, 0.31), vec3f(1.0, 0.91, 0.72));
}

fn sunlightVisibility(point: vec2f, elevation: f32, direction: vec3f) -> f32 {
  let horizontal = normalize(direction.xy);
  let rise = direction.z / max(length(direction.xy), 0.01);
  var visible = 1.0;
  for (var probeId = 1; probeId <= 8; probeId++) {
    let distance = f32(probeId) * 0.8 + f32(probeId * probeId) * 0.24;
    let probe = point + horizontal * distance;
    if (any(probe < vec2f(0.0)) || any(probe > view.grid.xy)) { break; }
    let blocker = (stateAt(probe).x - elevation) * 2.2 - rise * distance;
    let softness = 0.40 + distance * 0.10;
    visible = min(visible, 1.0 - smoothstep(-softness, softness, blocker));
  }
  return visible;
}

fn surfaceColor(point: vec2f, state: vec4f, grain: Grain, light: Light) -> vec3f {
  let left = stateAt(point - vec2f(1.0, 0.0)).x;
  let right = stateAt(point + vec2f(1.0, 0.0)).x;
  let above = stateAt(point - vec2f(0.0, 1.0)).x;
  let below = stateAt(point + vec2f(0.0, 1.0)).x;
  // 无量纲沙量映射为浅层沙床：旧的 4.8 倍高度使印章变成了尖锐折纸。
  let rawGradient = vec2f(right - left, below - above) * 1.1;
  let gradient = rawGradient / max(1.0, length(rawGradient) / 1.4);
  let wetness = view.controls.x;
  let microSlope = grain.slope * mix(0.64, 0.30, wetness) * grain.seam;
  let normal = normalize(vec3f(-gradient - microSlope, 1.0));
  let visibility = sunlightVisibility(point, state.x, light.direction);
  let wideNeighbors = stateAt(point - vec2f(4.0, 0.0)).x + stateAt(point + vec2f(4.0, 0.0)).x
    + stateAt(point - vec2f(0.0, 4.0)).x + stateAt(point + vec2f(0.0, 4.0)).x;
  let concavity = max(0.0, (left + right + above + below) * 0.25 - state.x)
    + max(0.0, wideNeighbors * 0.25 - state.x) * 0.80;
  let ambientOcclusion = exp(-concavity * 1.6) * mix(0.90, 1.0, grain.seam);
  let mineralColor = mix(vec3f(0.60, 0.45, 0.27), vec3f(0.78, 0.66, 0.47), grain.pigment);
  let darkMineral = 1.0 - (1.0 - smoothstep(0.015, 0.045, grain.mineral)) * 0.57;
  let composition = 0.93 + softNoise(point * 0.043) * 0.10 + (grain.detail - 0.5) * 0.055;
  let albedo = mineralColor * darkMineral * composition * mix(1.0, 0.67, wetness);
  let diffuse = max(0.0, dot(normal, light.direction));
  let reflected = albedo * (light.sky * ambientOcclusion + light.key * diffuse * visibility);
  let halfVector = normalize(light.direction + vec3f(0.0, 0.0, 1.0));
  // 少量晶粒高光，湿沙更平整；不把整片沙床处理成光滑塑料。
  let sparkle = pow(max(dot(normal, halfVector), 0.0), mix(35.0, 65.0, wetness))
    * smoothstep(0.91, 0.995, grain.mineral) * visibility * 0.065;
  let moving = min(1.0, state.y * 0.15) * view.controls.y;
  let filled = smoothstep(0.008, 0.14, state.x);
  // 清沙露出深色哑光画台，不能继续画出一层假沙；浅色粒子在其上自然稀疏。
  let base = vec3f(0.055, 0.062, 0.065) * (light.sky + light.key * light.direction.z)
    * (0.97 + softNoise(point * 0.08) * 0.06);
  return mix(base, reflected + light.key * sparkle + albedo * moving * 0.025, filled);
}

fn lightboxColor(uv: vec2f, state: vec4f, grain: Grain, light: Light) -> vec3f {
  // 以厚度衰减透光：零沙完全露出玻璃，薄层保留不连续颗粒，厚层形成暗部。
  let thickness = max(0.0, state.x);
  let edgeDistance = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  let glassGlow = 0.95 + smoothstep(0.0, 0.14, edgeDistance) * 0.05;
  let layerCoverage = 1.0 - exp(-thickness * 7.2);
  let presence = smoothstep(grain.pigment - 0.065, grain.pigment + 0.065, layerCoverage)
    * smoothstep(0.0, 0.018, thickness);
  let individual = presence * grain.coverage;
  // 薄层由不连续暗粒覆盖亮玻璃；沙堆叠之后才形成连续暗部，避免均匀灰雾。
  let layers = max(0.0, thickness - 0.24) * 7.0;
  let grainDepth = individual * min(thickness * 8.8, 4.4) * (0.50 + grain.mineral * 0.90);
  let transmission = exp(-(layers + grainDepth) * mix(1.0, 1.34, view.controls.x));
  // 透光薄粒保留灰棕差异，不能把单层粒子统一压成纯黑二值噪点。
  let thinTone = mix(vec3f(0.030, 0.016, 0.006), vec3f(0.068, 0.040, 0.016), grain.mineral);
  let deepTone = mix(vec3f(0.006, 0.0030, 0.0012), vec3f(0.018, 0.010, 0.004), grain.mineral);
  let sandTone = mix(thinTone, deepTone, smoothstep(0.25, 1.0, thickness));
  let darkGrain = sandTone * (0.85 + grain.seam * 0.15);
  return mix(darkGrain, light.lamp * glassGlow, transmission);
}

fn handCapsule(point: vec2f, start: vec2f, finish: vec2f, width: f32) -> f32 {
  let segment = finish - start;
  let fraction = clamp(dot(point - start, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
  return length(point - start - segment * fraction) - width;
}

fn cursorColor(point: vec2f, color: vec3f) -> vec3f {
  if (view.cursor.w < 0.5) { return color; }
  let offset = point - view.cursor.xy;
  let radius = view.cursor.z;
  let distance = length(offset);
  let pixel = max(length(fwidth(point)), 0.45);
  var underCursor = color;
  // 按下撒沙时的细粒落点反馈，使用实际接触位置和时间；不作为质量求解中的飞沙。
  if (view.tool.x < 0.5 && view.tool.y > 0.5 && view.controls.w < 0.5) {
    for (var dropId = 0; dropId < 14; dropId++) {
      let seed = hash2(vec2i(dropId, 517));
      let phase = fract(view.controls.z * (2.7 + seed.x * 1.6) + seed.y);
      let landing = (seed * 2.0 - 1.0) * radius * 0.72;
      let flight = vec2f((seed.x - 0.5) * 7.0, -9.0 - seed.y * 8.0) * (1.0 - phase);
      let dropPoint = landing + flight;
      let grainSize = mix(0.24, 0.48, seed.y);
      let speck = 1.0 - smoothstep(grainSize, grainSize + pixel * 0.65, length(offset - dropPoint));
      let shadowOffset = vec2f(1.3, 1.7) * (1.0 - phase);
      let dropShadow = 1.0 - smoothstep(grainSize + 0.2, grainSize + pixel, length(offset - dropPoint - shadowOffset));
      underCursor *= 1.0 - dropShadow * 0.19;
      underCursor = mix(underCursor, mix(vec3f(0.52, 0.31, 0.11), vec3f(0.88, 0.72, 0.43), seed.x), speck * 0.88);
    }
  }
  var rimDistance = abs(distance - radius);
  let palm = view.tool.x > 5.5 && view.tool.x < 6.5;
  let major = vec2f(cos(view.tool.z), sin(view.tool.z));
  let minor = vec2f(-major.y, major.x);
  if (palm) {
    let radii = vec2f(radius, radius * clamp(view.tool.w, 0.3, 1.0));
    let local = vec2f(dot(offset, major), dot(offset, minor)) / radii;
    let normalized = max(length(local), 1e-6);
    // First-order ellipse distance preserves a consistent rim width at both
    // axes, instead of making the flattened end much thicker than the side.
    rimDistance = abs(normalized - 1.0) / max(length(local / radii) / normalized, 1e-6);
  }
  let darkRim = 1.0 - smoothstep(pixel * 0.65, pixel * 1.55, rimDistance);
  let lightRim = 1.0 - smoothstep(pixel * 0.25, pixel * 0.75, rimDistance);
  var marker = 0.0;
  if (view.tool.x < 0.5) {
    for (var markerId = 0; markerId < 5; markerId++) {
      let angle = f32(markerId) * 2.3999632;
      let dotPoint = vec2f(cos(angle), sin(angle)) * radius * (0.17 + f32(markerId) * 0.09);
      marker = max(marker, 1.0 - smoothstep(pixel * 0.35, pixel * 0.85, length(offset - dotPoint)));
    }
  } else if (view.tool.x > 2.5 && view.tool.x < 3.5) {
    for (var tooth = -2; tooth <= 2; tooth++) {
      let toothPoint = vec2f(f32(tooth) * radius * 0.32, 0.0);
      marker = max(marker, 1.0 - smoothstep(pixel * 0.35, pixel * 0.85, length(offset - toothPoint)));
    }
  } else if (palm) {
    let lineDistance = length(vec2f(max(abs(dot(offset, major)) - radius * 0.24, 0.0), dot(offset, minor)));
    marker = 1.0 - smoothstep(pixel * 0.35, pixel * 0.85, lineDistance);
  } else {
    marker = 1.0 - smoothstep(pixel * 0.35, pixel * 0.85, distance);
  }
  let outlined = mix(underCursor, vec3f(0.035, 0.025, 0.016), darkRim * 0.78);
  var result = mix(outlined, vec3f(1.0, 0.96, 0.80), max(lightRim, marker) * 0.90);
  if (view.tool.x < 0.5 && view.pour.w > 0.5) {
    // The falling stream itself locates a hand pour. A perfect ground circle
    // suggests a uniform spray aperture and distracts from the actual grains.
    result = underCursor;
    // A readable translucent hand sits above the ground ring. The space
    // between its fingertips is exactly the projected physical emitter.
    // Only its gesture changes; AirborneSand supplies every visible grain.
    let handSize = clamp(radius * 0.35 + 10.0, 12.0, 20.0);
    let handPoint = (offset + vec2f(0.0, (20.0 + view.pour.y * 80.0) * 0.5)) / handSize + vec2f(0.0, 1.06);
    let pinching = view.pour.x < 0.5;
    let opened = view.pour.x > 1.5;
    let palmRadii = select(vec2f(0.94, 0.72), vec2f(0.78, 0.63), pinching);
    var shape = (length(handPoint / palmRadii) - 1.0) * palmRadii.y;
    if (pinching) {
      // Thumb and index converge around a narrow opening, with the remaining
      // fingers folded back toward the palm rather than four open prongs.
      shape = min(shape, handCapsule(handPoint, vec2f(0.49, 0.18), vec2f(0.17, 1.06), 0.14));
      shape = min(shape, handCapsule(handPoint, vec2f(-0.68, -0.04), vec2f(-0.17, 1.06), 0.145));
      for (var fingerId = 0; fingerId < 3; fingerId++) {
        let fingerX = 0.33 + f32(fingerId) * 0.16;
        shape = min(shape, handCapsule(handPoint, vec2f(fingerX, -0.13), vec2f(fingerX + 0.02, 0.54 - f32(fingerId) * 0.11), 0.12));
      }
    } else {
      for (var fingerId = 0; fingerId < 4; fingerId++) {
        let finger = f32(fingerId) - 1.5;
        let fingerX = finger * select(0.34, 0.44, opened);
        let splay = finger * select(0.035, 0.17, opened);
        let tipY = 1.12 - abs(finger) * select(0.06, 0.13, opened);
        let width = select(0.12, 0.145, opened);
        shape = min(shape, handCapsule(handPoint, vec2f(fingerX, 0.35), vec2f(fingerX + splay, tipY), width));
      }
      // A distinct thumb makes the open palm readable even at normal zoom.
      shape = min(shape, handCapsule(handPoint, vec2f(-0.73, -0.10),
        select(vec2f(-1.02, 0.53), vec2f(-1.31, 0.36), opened), 0.19));
    }
    shape *= handSize;
    let edge = 1.0 - smoothstep(pixel * 0.35, pixel * 0.95, abs(shape));
    let fill = 1.0 - smoothstep(-pixel, pixel, shape);
    result = mix(result, vec3f(0.53, 0.39, 0.23), fill * select(0.22, 0.40, view.tool.y > 0.5));
    let crease = abs(handCapsule(handPoint, vec2f(-0.39, 0.02), vec2f(0.30, 0.22), 0.0)) * handSize;
    let creaseInk = (1.0 - smoothstep(pixel * 0.25, pixel * 0.75, crease)) * fill;
    result = mix(result, vec3f(0.18, 0.12, 0.065), creaseInk * 0.36);
    result = mix(result, vec3f(0.29, 0.19, 0.095), edge * 0.48);
    result = mix(result, vec3f(0.93, 0.77, 0.52), edge * 0.30);
  }
  return result;
}

fn displayColor(linearColor: vec3f) -> vec3f {
  let bounded = clamp(linearColor, vec3f(0.0), vec3f(1.0));
  return select(bounded * 12.92, 1.055 * pow(bounded, vec3f(1.0 / 2.4)) - 0.055,
    bounded > vec3f(0.0031308));
}
@fragment fn fragment(vertexResult: VertexResult) -> @location(0) vec4f {
  let uv = clamp(vertexResult.uv, vec2f(0.0), vec2f(1.0));
  let point = uv * view.grid.xy;
  let state = stateAt(point);
  let grain = grainAt(point);
  let light = sceneLight();
  var color: vec3f;
  if (view.grid.z > 0.5) { color = lightboxColor(uv, state, grain, light); }
  else { color = surfaceColor(point, state, grain, light); }
  color = cursorColor(point, color);
  return vec4f(displayColor(color), 1.0);
}
`

// Every instance is one real AirborneSand parcel. Grain shading varies within
// its ellipse; no repeated point sprites or time-based decorative emitters.
export const airborneRenderShader = /* wgsl */ `
struct View {
  grid: vec4f,
  controls: vec4f,
  cursor: vec4f,
  tool: vec4f,
  pour: vec4f,
}
@group(0) @binding(0) var<uniform> view: View;
struct AirVertex {
  @builtin(position) clip: vec4f,
  @location(0) local: vec2f,
  @location(1) material: vec2f,
}
fn quad(vertexId: u32) -> vec2f {
  let points = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0));
  return points[vertexId];
}
fn clipPoint(point: vec2f) -> vec4f {
  // AirGrain coordinates stay in the 512 x 384 drawing domain, including
  // reduced solver grids used for tests and previews.
  return vec4f(point.x / 512.0 * 2.0 - 1.0, 1.0 - point.y / 384.0 * 2.0, 0.0, 1.0);
}
fn lightDirection() -> vec3f {
  if (view.grid.w > 1.5) { return normalize(vec3f(0.58, -0.38, 0.52)); }
  if (view.grid.w > 0.5) { return normalize(vec3f(-0.84, -0.37, 0.43)); }
  return normalize(vec3f(-0.59, -0.50, 0.56));
}
fn lightKey() -> vec3f {
  if (view.grid.w > 1.5) { return vec3f(0.36, 0.61, 1.05); }
  if (view.grid.w > 0.5) { return vec3f(1.07, 0.78, 0.47); }
  return vec3f(1.14, 1.06, 0.94);
}
fn displayColor(color: vec3f) -> vec3f {
  let bounded = clamp(color, vec3f(0.0), vec3f(1.0));
  return select(bounded * 12.92, 1.055 * pow(bounded, vec3f(1.0 / 2.4)) - 0.055, bounded > vec3f(0.0031308));
}
@vertex fn grainVertex(@builtin(vertex_index) vertexId: u32,
  @location(0) grain: vec4f, @location(1) motion: vec4f) -> AirVertex {
  let local = quad(vertexId);
  let radius = clamp(0.36 + pow(max(grain.w, 0.0), 0.25) * 0.13, 0.36, 1.1);
  let projectedMotion = vec2f(motion.x, motion.y - motion.z * 0.5);
  let axis = normalize(projectedMotion + vec2f(0.001, 0.002));
  let side = vec2f(-axis.y, axis.x);
  let aspect = 0.72 + motion.w * 0.36;
  let elongation = 1.0 + min(length(projectedMotion) / 800.0, 0.45);
  let displacement = axis * local.x * radius * elongation + side * local.y * radius * aspect;
  var result: AirVertex;
  result.clip = clipPoint(grain.xy + vec2f(0.0, -grain.z * 0.5) + displacement);
  result.local = local;
  result.material = vec2f(motion.w, grain.z);
  return result;
}
@fragment fn grainFragment(vertexResult: AirVertex) -> @location(0) vec4f {
  let squared = dot(vertexResult.local, vertexResult.local);
  let aa = max(fwidth(squared), 0.06);
  let coverage = 1.0 - smoothstep(1.0 - aa, 1.0 + aa, squared);
  let normal = normalize(vec3f(vertexResult.local * 0.65, sqrt(max(0.08, 1.0 - squared * 0.65))));
  let mineral = mix(vec3f(0.53, 0.35, 0.17), vec3f(0.87, 0.72, 0.47), vertexResult.material.x);
  let facet = 0.91 + sin(vertexResult.local.x * 8.0 + vertexResult.local.y * 5.0 + vertexResult.material.x * 31.0) * 0.07;
  let diffuse = max(0.0, dot(normal, lightDirection()));
  let color = mineral * facet * (vec3f(0.22, 0.23, 0.24) + lightKey() * diffuse * 0.90);
  return vec4f(displayColor(color), coverage * 0.95);
}
@vertex fn shadowVertex(@builtin(vertex_index) vertexId: u32,
  @location(0) grain: vec4f, @location(1) motion: vec4f) -> AirVertex {
  let local = quad(vertexId);
  let radius = 0.90 + max(grain.z, 0.0) * 0.055;
  // A short offset along the ground light direction and increasing penumbra
  // show separation from the bed without enormous overlapping dark circles.
  let shadowCenter = grain.xy - lightDirection().xy * grain.z * 0.10;
  var result: AirVertex;
  result.clip = clipPoint(shadowCenter + local * vec2f(radius, radius * 0.72));
  result.local = local;
  result.material = vec2f(motion.w, grain.z);
  return result;
}
@fragment fn shadowFragment(vertexResult: AirVertex) -> @location(0) vec4f {
  let squared = dot(vertexResult.local, vertexResult.local);
  let penumbra = exp(-squared * 3.2) * (1.0 - smoothstep(0.65, 1.0, squared));
  let heightFade = exp(-max(vertexResult.material.y, 0.0) * 0.025);
  return vec4f(0.035, 0.025, 0.015, penumbra * heightFade * 0.16);
}
`

/** 全屏沙床渲染，纹理目标与画布尺寸由调用者管理。 */
export class ArtRenderer {
  private readonly device: GPUDevice
  private readonly format: GPUTextureFormat
  private readonly states: readonly GPUBuffer[]
  private readonly width: number
  private readonly height: number
  private readonly uniform: GPUBuffer
  private readonly airborne?: AirborneSand
  private particleBuffer: GPUBuffer | null = null
  private particleCapacity = 0
  private airGroup: GPUBindGroup | null = null
  private airPipeline: GPURenderPipeline | null = null
  private shadowPipeline: GPURenderPipeline | null = null
  private pipeline: GPURenderPipeline | null = null
  private groups: GPUBindGroup[] = []
  private disposed = false

  constructor(device: GPUDevice, format: GPUTextureFormat, buffers: readonly GPUBuffer[], width = GRID_WIDTH, height = GRID_HEIGHT, airborne?: AirborneSand) {
    if (!Number.isInteger(width) || width < 2 || !Number.isInteger(height) || height < 2) throw new Error('沙画网格宽高必须是至少 2 的整数。')
    if (!buffers.length) throw new Error('沙画渲染需要至少一个状态缓冲区。')
    this.device = device
    this.format = format
    this.states = buffers
    this.width = width
    this.height = height
    this.airborne = airborne
    this.uniform = device.createBuffer({ label: 'Sand art render view', size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  }

  async initialize() {
    if (this.disposed) throw new Error('沙画渲染器已释放。')
    if (this.pipeline) return
    const module = this.device.createShaderModule({ label: 'Sand art surface and lightbox WGSL', code: artRenderShader })
    const compilation = await module.getCompilationInfo()
    const failures = compilation.messages.filter((message) => message.type === 'error')
    if (failures.length) throw new Error(failures.map((message) => `WGSL ${message.lineNum}:${message.linePos} ${message.message}`).join('\n'))
    this.pipeline = await this.device.createRenderPipelineAsync({
      label: 'Sand art render pipeline', layout: 'auto',
      vertex: { module, entryPoint: 'vertex' },
      fragment: { module, entryPoint: 'fragment', targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list' },
    })
    this.groups = this.states.map((buffer) => this.device.createBindGroup({
      label: 'Sand art render state', layout: this.pipeline!.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniform } }, { binding: 1, resource: { buffer } }],
    }))
    if (this.airborne) {
      const airModule = this.device.createShaderModule({ label: 'Real airborne sand grains and ground shadows', code: airborneRenderShader })
      const airCompilation = await airModule.getCompilationInfo()
      const airFailures = airCompilation.messages.filter(message => message.type === 'error')
      if (airFailures.length) throw new Error(airFailures.map(message => `WGSL ${message.lineNum}:${message.linePos} ${message.message}`).join('\n'))
      const airLayout = this.device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }] })
      const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [airLayout] })
      const makeAirPipeline = (vertex: string, fragment: string) => this.device.createRenderPipelineAsync({
        label: `Sand art ${vertex}`, layout: pipelineLayout,
        vertex: { module: airModule, entryPoint: vertex, buffers: [{ arrayStride: 32, stepMode: 'instance', attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x4' }, { shaderLocation: 1, offset: 16, format: 'float32x4' }] }] },
        fragment: { module: airModule, entryPoint: fragment, targets: [{ format: this.format, blend: { color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' }, alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' } } }] },
        primitive: { topology: 'triangle-list' },
      })
      ;[this.airPipeline, this.shadowPipeline] = await Promise.all([makeAirPipeline('grainVertex', 'grainFragment'), makeAirPipeline('shadowVertex', 'shadowFragment')])
      this.airGroup = this.device.createBindGroup({ label: 'Sand art airborne view', layout: airLayout, entries: [{ binding: 0, resource: { buffer: this.uniform } }] })
    }
  }

  private uploadParticles() {
    const particles = this.airborne?.particles
    const count = particles?.length ?? 0
    if (!particles || !count) return 0
    if (count > this.particleCapacity) {
      this.particleBuffer?.destroy()
      this.particleCapacity = 2 ** Math.ceil(Math.log2(Math.max(256, count)))
      this.particleBuffer = this.device.createBuffer({ label: 'Sand art live airborne instances', size: this.particleCapacity * 32, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST })
    }
    const values = new Float32Array(count * 8)
    particles.forEach((grain, index) => values.set([grain.x, grain.y, grain.z, grain.mass, grain.vx, grain.vy, grain.vz, grain.seed], index * 8))
    this.device.queue.writeBuffer(this.particleBuffer!, 0, values)
    return count
  }

  encode(encoder: GPUCommandEncoder, target: GPUTextureView, stateIndex: number, options: ArtRenderOptions) {
    if (!this.pipeline || this.disposed) throw new Error('请先初始化沙画渲染器。')
    const group = this.groups[stateIndex]
    if (!group) throw new Error(`不存在沙画状态缓冲区 ${stateIndex}。`)
    const cursor = options.cursor
    const angle = cursor?.angle ?? 0
    const aspect = cursor?.aspect ?? 0.45
    const light = options.light === 'sunset' ? 1 : options.light === 'moon' ? 2 : 0
    const pour = cursor?.pour
    this.device.queue.writeBuffer(this.uniform, 0, new Float32Array([
      this.width, this.height, options.mode === 'lightbox' ? 1 : 0, light,
      clamp(options.wetness, 0, 1), clamp(options.wind, 0, 1), options.time, this.airborne ? 1 : 0,
      cursor?.x ?? 0, cursor?.y ?? 0, Math.max(1, cursor?.radius ?? 1), cursor?.active ? 1 : 0,
      cursor ? toolCodes[cursor.tool] : 0, cursor?.down ? 1 : 0,
      Number.isFinite(angle) ? angle : 0,
      clamp(Number.isFinite(aspect) ? aspect : 0.45, 0.3, 1),
      pour?.style === 'handful' ? 2 : pour?.style === 'scatter' ? 1 : 0,
      clamp(pour?.height ?? 0, 0, 1), clamp(pour?.spread ?? 0, 0, 1), pour ? 1 : 0,
    ]))
    const particleCount = this.uploadParticles()
    const pass = encoder.beginRenderPass({ label: 'Sand art canvas', colorAttachments: [{ view: target, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0, g: 0, b: 0, a: 1 } }] })
    pass.setPipeline(this.pipeline)
    pass.setBindGroup(0, group)
    pass.draw(3)
    if (particleCount && this.airPipeline && this.shadowPipeline && this.airGroup && this.particleBuffer) {
      pass.setBindGroup(0, this.airGroup)
      pass.setVertexBuffer(0, this.particleBuffer)
      pass.setPipeline(this.shadowPipeline)
      pass.draw(6, particleCount)
      pass.setPipeline(this.airPipeline)
      pass.draw(6, particleCount)
    }
    pass.end()
  }

  destroy() {
    if (this.disposed) return
    this.disposed = true
    this.uniform.destroy()
    this.particleBuffer?.destroy()
    this.particleBuffer = null
    this.particleCapacity = 0
    this.airGroup = null
    this.airPipeline = null
    this.shadowPipeline = null
    this.groups = []
    this.pipeline = null
  }
}
