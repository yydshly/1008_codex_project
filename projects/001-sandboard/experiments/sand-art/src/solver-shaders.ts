import { GRID_HEIGHT, GRID_WIDTH, MAX_CONTACTS } from './model'

// Adapted from Sandboard src/simulation/{flux,shaders}.ts at
// 489cb01e81b11ba575887f7c76760498eb41aaa8 (GPL-3.0, project LICENSE).
// Changes: zero-floor thickness, rectangular grids, sand-art tools, wetness and
// conservative wind advection and delayed CPU grain-packet deposition.
export const artSolverShader = `
struct ToolContact { start: vec4f, end: vec4f, motion: vec4f }
struct Params {
  grid: vec4f,
  environment: vec4f,
  control: vec4f,
  contacts: array<ToolContact, ${MAX_CONTACTS}>,
}
struct Flux { axial: vec4f, diagonal: vec4f }
struct Flow { free: Flux, forced: Flux }
const neighbors = array<vec2i, 8>(
  vec2i(-1, 0), vec2i(1, 0), vec2i(0, -1), vec2i(0, 1),
  vec2i(-1, -1), vec2i(1, 1), vec2i(1, -1), vec2i(-1, 1)
);
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> source: array<vec4f>;
@group(0) @binding(2) var<storage, read_write> destination: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> flux: array<Flow>;
@group(0) @binding(4) var<storage, read_write> contactField: array<vec4f>;
@group(0) @binding(5) var<storage, read_write> receiverBudget: array<f32>;
@group(0) @binding(6) var<storage, read> reference: array<vec4f>;
@group(0) @binding(7) var<storage, read> deposition: array<f32>;

fn inside(cell: vec2i) -> bool {
  return all(cell >= vec2i(0)) && all(cell < vec2i(params.grid.xy));
}
fn address(cell: vec2i) -> u32 { return u32(cell.y) * u32(params.grid.x) + u32(cell.x); }
fn spacing() -> vec2f { return vec2f(${GRID_WIDTH}.0, ${GRID_HEIGHT}.0) / params.grid.xy; }
fn location(cell: vec2i) -> vec2f { return (vec2f(cell) + 0.5) * spacing(); }
fn totalFlux(value: Flux) -> f32 { return dot(value.axial + value.diagonal, vec4f(1.0)); }
fn component(value: Flux, axis: u32) -> f32 {
  if (axis < 4u) { return value.axial[axis]; }
  return value.diagonal[axis - 4u];
}
fn flowVector(value: Flux) -> vec2f {
  return vec2f(value.axial.y - value.axial.x - value.diagonal.x + value.diagonal.y + value.diagonal.z - value.diagonal.w,
    value.axial.w - value.axial.z - value.diagonal.x + value.diagonal.y - value.diagonal.z + value.diagonal.w);
}
fn ridgeLimit() -> f32 { return select(3.2, 0.8, params.grid.w > 0.5); }
fn referenceAmount(position: vec2f) -> f32 {
  let cell = vec2i(clamp(position / spacing(), vec2f(0.0), params.grid.xy - 1.0));
  return reference[address(cell)].x;
}
fn presentAmount(position: vec2f) -> f32 {
  let cell = vec2i(clamp(position / spacing(), vec2f(0.0), params.grid.xy - 1.0));
  return source[address(cell)].x;
}
fn envelope(distance: f32) -> f32 {
  let core = max(0.0, 1.0 - distance * distance);
  return core * core;
}
fn segmentDistance(point: vec2f, start: vec2f, end: vec2f) -> f32 {
  let segment = end - start;
  let along = clamp(dot(point - start, segment) / max(dot(segment, segment), 1e-6), 0.0, 1.0);
  return length(point - start - segment * along);
}
fn palmCoordinate(offset: vec2f, tool: ToolContact) -> vec2f {
  let major = vec2f(cos(tool.motion.z), sin(tool.motion.z));
  let minor = vec2f(-major.y, major.x);
  return vec2f(dot(offset, major), dot(offset, minor) / clamp(tool.motion.w, 0.3, 1.0));
}
fn footprint(point: vec2f, tool: ToolContact) -> f32 {
  let radius = max(tool.start.z, 0.25);
  let code = u32(tool.end.z);
  if (code == 6u) {
    // Affine normalization sweeps one fixed rotated ellipse over the whole
    // segment. The nearest point must be measured in this metric; a Euclidean
    // projection clips oblique ellipses and introduces narrow joins.
    let localPoint = palmCoordinate(point - tool.start.xy, tool);
    let localSegment = palmCoordinate(tool.end.xy - tool.start.xy, tool);
    return envelope(segmentDistance(localPoint, vec2f(0.0), localSegment) / radius);
  }
  if (code == 3u) {
    // Five teeth swept along the gesture; stationary rakes retain their shape.
    let segment = tool.end.xy - tool.start.xy;
    let speed = length(segment);
    let direction = select(vec2f(1.0, 0.0), segment / max(speed, 1e-6), speed > 0.01);
    let side = vec2f(-direction.y, direction.x);
    var value = 0.0;
    for (var tooth = 0; tooth < 5; tooth++) {
      let offset = side * (f32(tooth) - 2.0) * radius * 0.40;
      value = max(value, envelope(segmentDistance(point, tool.start.xy + offset, tool.end.xy + offset) / (radius * 0.12)));
    }
    return value;
  }
  if (code == 4u) {
    let q = (point - tool.end.xy) / radius;
    let y = -q.y;
    let a = dot(q, q) - 0.72;
    let heart = a * a * a - q.x * q.x * y * y * y;
    // Convert the implicit value to a local edge distance. A wide smoothstep
    // on the polynomial itself erases the two lobes and the pointed tip.
    let gradient = vec2f(6.0 * q.x * a * a - 2.0 * q.x * y * y * y,
      6.0 * y * a * a - 3.0 * q.x * q.x * y * y);
    let edgeDistance = heart / max(length(gradient), 0.02);
    // Keep enough pressure over the whole template, with a continuous interior
    // potential that directs sand toward its boundary rather than a flat core.
    return (1.0 - smoothstep(-0.04, 0.0, edgeDistance))
      * (0.85 + 0.15 * clamp(-heart / 0.5, 0.0, 1.0));
  }
  return envelope(segmentDistance(point, tool.start.xy, tool.end.xy) / radius);
}
fn sampleTool(position: vec2f) -> vec4f {
  var pressure = 0.0;
  var pour = 0.0;
  var velocity = vec2f(0.0);
  for (var index = 0u; index < ${MAX_CONTACTS}u; index++) {
    if (f32(index) >= params.control.x) { break; }
    let tool = params.contacts[index];
    let coverage = footprint(position, tool);
    let strength = coverage * tool.start.w * tool.end.w;
    let code = u32(tool.end.z);
    if (code == 0u) {
      // A stationary contact deposits external material, proportional to time.
      pour += strength * select(24.0, 12.0, params.grid.w > 0.5);
    } else {
      var depth = select(1.75, 0.50, params.grid.w > 0.5);
      if (code == 2u) { depth = select(2.40, 0.85, params.grid.w > 0.5); }
      if (code == 3u) { depth = select(2.15, 0.72, params.grid.w > 0.5); }
      if (code == 4u) { depth = select(2.15, 1.30, params.grid.w > 0.5); }
      if (code == 6u) {
        let major = vec2f(cos(tool.motion.z), sin(tool.motion.z));
        let minor = vec2f(-major.y, major.x);
        let segment = tool.end.xy - tool.start.xy;
        let direction = segment / max(length(segment), 1e-6);
        let side = vec2f(-direction.y, direction.x);
        let aspect = clamp(tool.motion.w, 0.3, 1.0);
        let sweptWidth = tool.start.z * length(vec2f(dot(side, major), aspect * dot(side, minor)));
        let transverseRadius = select(tool.start.z * aspect, sweptWidth, length(segment) > 0.01);
        // A wider lightbox pad otherwise retains only a narrow bright groove:
        // pressure curvature falls with squared width. Compensate its potential
        // up to four times the small-pad response. Surface palms retain a softer
        // sculpting pressure. Shared mass/receiver limits retain all displaced sand.
        depth = select(1.75, 0.85 * clamp(pow(transverseRadius / 14.0, 2.0), 1.0, 4.0), params.grid.w > 0.5);
      }
      // The loaded artwork may contain far more sand than the thin default bed.
      // Scale penetration with its fixed initial thickness, keeping the brush
      // equally useful on a dark imported image and on a fresh thin lightbox.
      // A palm instead keeps one geometry-only pressure plane. Imported grain
      // variation must not turn into pressure columns that trap comb-like ridges.
      if (params.grid.w > 0.5 && code != 6u) {
        // Current material is sampled under the center of the moving brush.
        // Sampling it at the rim amplifies a deposited bank into a high-pressure
        // ring, which pushes sand back into the line at each previous endpoint.
        let segment = tool.end.xy - tool.start.xy;
        let along = clamp(dot(position - tool.start.xy, segment) / max(dot(segment, segment), 1e-6), 0.0, 1.0);
        let centerline = select(tool.start.xy + along * segment, tool.end.xy, code == 4u);
        let material = max(referenceAmount(position), presentAmount(centerline));
        depth *= clamp(pow(max(1.0, material / 0.24), 1.5), 1.0, 12.0);
      }
      // Negative contact pressure marks a smoothing brush. It lowers local
      // repose without creating a depression or adding/removing material.
      let localPressure = select(strength * depth, -strength, code == 5u);
      if (abs(localPressure) > abs(pressure)) {
        pressure = localPressure;
        // Cutting/stamping sweeps a pressure footprint. A push also carries
        // directional slip; assigning that slip to cutters causes symmetric
        // backfill that leaves bright endpoint dots in an otherwise dark line.
        velocity = select(vec2f(0.0), tool.motion.xy, code == 1u);
      }
    }
  }
  return vec4f(pressure, pour, velocity);
}

@compute @workgroup_size(8, 8)
fn reset(@builtin(global_invocation_id) id: vec3u) {
  let cell = vec2i(id.xy);
  if (!inside(cell)) { return; }
  destination[address(cell)] = vec4f(params.control.y, 0.0, 0.0, 0.0);
}
@compute @workgroup_size(8, 8)
fn contact(@builtin(global_invocation_id) id: vec3u) {
  let cell = vec2i(id.xy);
  if (!inside(cell)) { return; }
  let index = address(cell);
  var value = sampleTool(location(cell));
  // The field survives all local solver iterations. Divide by the whole input
  // dt so integrating each dt/iterations adds each landed packet exactly once.
  value.y += deposition[index] / max(params.control.w, 1e-9);
  contactField[index] = value;
}
@compute @workgroup_size(8, 8)
fn transport(@builtin(global_invocation_id) id: vec3u) {
  let cell = vec2i(id.xy);
  if (!inside(cell)) { return; }
  let center = source[address(cell)];
  let rawTool = contactField[address(cell)];
  let tool = vec4f(max(0.0, rawTool.x), rawTool.yzw);
  let wetness = params.environment.x;
  let mobility = mix(1.0, 0.32, wetness);
  let dt = params.grid.z;
  let referenceHeight = select(2.0, 0.24, params.grid.w > 0.5);
  let toolSpeed = length(tool.zw);
  let direction = tool.zw / max(toolSpeed, 1e-6);
  let speedResponse = toolSpeed / (toolSpeed + 140.0);
  var outgoing = Flux(vec4f(0.0), vec4f(0.0));
  var free = Flux(vec4f(0.0), vec4f(0.0));
  var escape = Flux(vec4f(0.0), vec4f(0.0));
  for (var axis = 0u; axis < 8u; axis++) {
    let neighbor = cell + neighbors[axis];
    if (!inside(neighbor)) { continue; }
    let other = source[address(neighbor)];
    let rawOtherTool = contactField[address(neighbor)];
    let otherTool = vec4f(max(0.0, rawOtherTool.x), rawOtherTool.yzw);
    let edgeVector = vec2f(neighbors[axis]) * spacing();
    let linkLength = length(edgeVector);
    let axisDirection = edgeVector / linkLength;
    let weight = select(0.66666667, 0.16666667, axis >= 4u);
    let contactYield = clamp(max(tool.x, otherTool.x) / max(referenceHeight, 0.24), 0.0, 1.0);
    // Repose holds shallow grooves still; wetness raises it and reduces motion.
    let smoothing = clamp(max(-rawTool.x, -rawOtherTool.x) * 2.0, 0.0, 1.0);
    let threshold = 0.055 * pow(linkLength, 0.4) * (1.0 + wetness * 2.5)
      * mix(1.0, 0.10, contactYield) * mix(1.0, 0.015, smoothing);
    let brushActive = max(abs(rawTool.x), abs(rawOtherTool.x)) > 1e-6 || max(tool.y, otherTool.y) > 1e-6;
    let canRelax = params.control.z < 0.5 || brushActive;
    let excess = select(0.0, max(0.0, center.x + tool.x - other.x - otherTool.x - threshold), canRelax);
    let forward = max(0.0, dot(axisDirection, direction));
    var amount = excess * dt * 23.0 * weight * mobility * mix(1.0, 1.45, smoothing) / sqrt(linkLength);
    amount *= 1.0 + speedResponse * forward * 0.9;
    // Only pressure/smoothing deformations use the ridge receiver limit. Pour
    // relaxation and wind retain their full independent conservative transport.
    let deformation = max(tool.x, otherTool.x) > 0.0 || smoothing > 0.0;
    var freeAmount = select(amount, 0.0, deformation);
    amount = select(0.0, amount, deformation);
    // Wind is upwind advection of existing mass, with closed grid boundaries.
    freeAmount += center.x * params.environment.y * max(0.0, dot(axisDirection, params.environment.zw))
      * dt * 11.0 * weight * mobility / linkLength;
    let edge = max(0.0, tool.x - otherTool.x);
    // Pressure gradients should dominate evacuation. A large symmetric side
    // term makes neighboring contact cells immediately refill a fast groove.
    let sideways = tool.x * (1.0 - abs(dot(axisDirection, direction))) * speedResponse * 0.002;
    let escapeWeight = (edge + sideways) * weight * (1.0 + forward * speedResponse * 0.5);
    if (axis < 4u) { outgoing.axial[axis] = amount; free.axial[axis] = freeAmount; escape.axial[axis] = escapeWeight; }
    else { outgoing.diagonal[axis - 4u] = amount; free.diagonal[axis - 4u] = freeAmount; escape.diagonal[axis - 4u] = escapeWeight; }
  }
  // Finite pressure evacuates overlap, but every evacuated unit stays in flux.
  let targetHeight = max(0.0, referenceHeight - tool.x);
  let overlap = max(0.0, center.x - targetHeight);
  // A queued moving brush often touches a cell for only one 120 Hz step. Speed
  // up pressure response locally, keeping natural relaxation at its stable rate.
  let contactRate = 1.0 + clamp(tool.x / max(referenceHeight, 0.24), 0.0, 1.0) * 5.0;
  let desired = overlap * (1.0 - exp(-dt * 80.0 * mobility * mobility * contactRate));
  let extra = max(0.0, desired - totalFlux(outgoing));
  let escapeTotal = totalFlux(escape);
  if (tool.x > 0.0 && escapeTotal > 1e-8) {
    outgoing.axial += escape.axial * (extra / escapeTotal);
    outgoing.diagonal += escape.diagonal * (extra / escapeTotal);
  }
  // One shared limiter covers all eight outgoing links, including wind.
  let limiter = min(1.0, max(0.0, center.x) / max(totalFlux(outgoing) + totalFlux(free), 1e-8));
  flux[address(cell)] = Flow(Flux(free.axial * limiter, free.diagonal * limiter),
    Flux(outgoing.axial * limiter, outgoing.diagonal * limiter));
}
@compute @workgroup_size(8, 8)
fn capacity(@builtin(global_invocation_id) id: vec3u) {
  let cell = vec2i(id.xy);
  if (!inside(cell)) { return; }
  var incoming = 0.0;
  for (var axis = 0u; axis < 8u; axis++) {
    let neighbor = cell + neighbors[axis];
    if (inside(neighbor)) { incoming += component(flux[address(neighbor)].forced, axis ^ 1u); }
  }
  // Use headroom before outgoing transfers: receiving can never assume a
  // proposed outgoing link will be accepted. This avoids an iterative limiter.
  // Moving a thick imported bed needs proportionally more bank headroom than
  // the thin default. The fixed reference prevents repeated stamping from
  // ratcheting this allowance upward on every step.
  let allowance = select(1.2, max(0.56, reference[address(cell)].x * 1.2), params.grid.w > 0.5);
  let maximum = max(ridgeLimit(), reference[address(cell)].x + allowance);
  let available = max(0.0, maximum - source[address(cell)].x);
  receiverBudget[address(cell)] = min(1.0, available / max(incoming, 1e-8));
}
@compute @workgroup_size(8, 8)
fn integrate(@builtin(global_invocation_id) id: vec3u) {
  let cell = vec2i(id.xy);
  if (!inside(cell)) { return; }
  let index = address(cell);
  let current = source[index];
  let proposal = flux[index];
  var outgoing = Flux(vec4f(0.0), vec4f(0.0));
  var incoming = Flux(vec4f(0.0), vec4f(0.0));
  for (var axis = 0u; axis < 8u; axis++) {
    let neighbor = cell + neighbors[axis];
    if (!inside(neighbor)) { continue; }
    let other = flux[address(neighbor)];
    let amount = component(other.free, axis ^ 1u) + component(other.forced, axis ^ 1u) * receiverBudget[index];
    let leaving = component(proposal.free, axis) + component(proposal.forced, axis) * receiverBudget[address(neighbor)];
    if (axis < 4u) { incoming.axial[axis] = amount; outgoing.axial[axis] = leaving; }
    else { incoming.diagonal[axis - 4u] = amount; outgoing.diagonal[axis - 4u] = leaving; }
  }
  let addition = contactField[index].y * params.grid.z;
  // Subtract before adding: guards float rounding at an exhausted zero-floor cell.
  let height = max(0.0, current.x - totalFlux(outgoing)) + totalFlux(incoming) + addition;
  let moved = totalFlux(incoming) + totalFlux(outgoing) + addition;
  let activity = max(current.y * exp(-params.grid.z * 9.0), min(1.0, moved * 4.0));
  let velocity = (flowVector(outgoing) - flowVector(incoming)) * spacing() / max(height * params.grid.z, 0.002);
  destination[index] = vec4f(height, activity, mix(current.zw, clamp(velocity, vec2f(-250.0), vec2f(250.0)), 0.4));
}
`
