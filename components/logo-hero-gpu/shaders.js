/**
 * WGSL for the logo hero.
 *
 * Pass one draws the whole field into a transparent offscreen target. Pass two
 * composites it to the canvas and adds grain. Nothing fills the background:
 * the field alone has to be dense enough to carry white text.
 */

/**
 * The logo field: one instanced draw, no vertex buffers. Each instance builds
 * its own quad from `vertex_index` and samples a shared distance field, so the
 * mark stays crisp from a few pixels to most of the screen with no mip chain.
 *
 * Because a logo is flat colour, defocus is just a wider edge: widening the
 * distance-field threshold by the instance's circle of confusion gives a real
 * depth-of-field blur for the cost of one extra `max`.
 */
export const FIELD_WGSL = /* wgsl */ `
struct Params {
  resolution: vec2f,
  heroHeight: f32,
  time: f32,
  fade: f32,
  quadScale: f32,
  aspect: f32,
  // Distance-field units per screen pixel, before the instance's own width.
  sdfScale: f32,
  sharpness: f32,
  maxBlur: f32,
  _pad: vec2f,
  colorLow: vec4f,
  colorHigh: vec4f,
}

struct Instance {
  // x fraction, y fraction of hero height, width in px, rotation in radians
  place: vec4f,
  // delay in seconds, alpha, circle of confusion in px, shade
  style: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<uniform> instances: array<Instance, ${'${MAX_INSTANCES}'}>;
@group(0) @binding(2) var glyph: texture_2d<f32>;
@group(0) @binding(3) var glyphSampler: sampler;

fn hash11(n: f32) -> f32 {
  return fract(sin(n * 12.9898) * 43758.5453);
}

struct VertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
  @location(1) tint: vec4f,
  @location(2) blur: f32,
  @location(3) aa: f32,
}

@vertex fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOut {
  let inst = instances[instanceIndex];
  let delay = inst.style.x;

  // 0 before this logo's turn, 1 once it has fully landed.
  let raw = clamp((params.time - delay) / max(params.fade, 1e-5), 0.0, 1.0);
  let reveal = raw * raw * (3.0 - 2.0 * raw);

  var corners = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(1.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 1.0),
  );
  let corner = corners[vertexIndex];

  // Unrevealed instances collapse to a point and are dropped by the rasterizer.
  let width = inst.place.z * params.quadScale * step(1e-4, reveal);
  let height = width * params.aspect;

  // A small rotation that settles out as the logo lands. Pure noise, so it is
  // derived here rather than taking up room in the instance buffer.
  let settle = (hash11(f32(instanceIndex) + 0.5) - 0.5) * 0.35;
  let rotation = inst.place.w + settle * (1.0 - reveal);

  let local = (corner - vec2f(0.5)) * vec2f(width, height);
  let s = sin(rotation);
  let c = cos(rotation);
  let rotated = vec2f(local.x * c - local.y * s, local.x * s + local.y * c);

  // y is a fraction of the hero, not of the canvas: the canvas is taller so
  // logos on the bottom edge can hang past it without being cut off.
  let anchor = vec2f(inst.place.x * params.resolution.x, inst.place.y * params.heroHeight);
  let pixel = anchor + rotated;

  var out: VertexOut;
  out.position = vec4f(
    pixel.x / params.resolution.x * 2.0 - 1.0,
    1.0 - pixel.y / params.resolution.y * 2.0,
    0.0,
    1.0,
  );
  out.uv = corner;
  // Premultiplied, so overlapping logos accumulate coverage correctly on a
  // transparent target.
  let alpha = inst.style.y * reveal;
  out.tint = vec4f(mix(params.colorLow.rgb, params.colorHigh.rgb, inst.style.w) * alpha, alpha);
  // One pixel of the quad, in distance-field units. A proper Euclidean field
  // has unit gradient, so this is exact and needs no screen-space derivative
  // of the sampled texture, which is blocky under magnification and was the
  // source of stair-stepping on diagonal edges.
  let pixelInField = params.sdfScale / max(width, 1e-3);
  out.blur = min(params.maxBlur, inst.style.z * pixelInField);
  out.aa = params.sharpness * 0.5 * pixelInField;
  return out;
}

fn cover(uv: vec2f, edge: f32) -> f32 {
  return smoothstep(0.5 - edge, 0.5 + edge, textureSampleLevel(glyph, glyphSampler, uv, 0.0).r);
}

@fragment fn fs_main(
  @location(0) uv: vec2f,
  @location(1) tint: vec4f,
  @location(2) blur: f32,
  @location(3) aa: f32,
) -> @location(0) vec4f {
  let edge = max(max(aa, 1e-5), blur);

  // Bilinear magnification bends a distance field's contour within each texel,
  // so a single sample leaves visible facets on a slanted edge. Four samples on
  // a rotated grid average those out: same two draw calls, four texture reads.
  let dx = dpdx(uv);
  let dy = dpdy(uv);
  let a = dx * 0.125 + dy * 0.375;
  let b = dx * 0.375 - dy * 0.125;
  let coverage = (cover(uv + a, edge) + cover(uv - a, edge)
    + cover(uv + b, edge) + cover(uv - b, edge)) * 0.25;

  return tint * coverage;
}
`

/**
 * Composite: the field, plus monochromatic grain. Grain is scaled by coverage
 * so it never shows up in the transparent margins around the ragged edge.
 */
export const COMPOSITE_WGSL = /* wgsl */ `
struct Post {
  resolution: vec2f,
  grain: f32,
  grainSize: f32,
}

@group(0) @binding(0) var<uniform> post: Post;
@group(0) @binding(1) var scene: texture_2d<f32>;
@group(0) @binding(2) var sceneSampler: sampler;

fn hash21(p: vec2f) -> f32 {
  var q = fract(vec3f(p.xyx) * vec3f(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let src = textureSampleLevel(scene, sceneSampler, uv, 0.0);
  let cell = floor(uv * post.resolution / max(post.grainSize, 1.0));
  let noise = hash21(cell) - 0.5;
  // Premultiplied in, premultiplied out.
  return vec4f(src.rgb + noise * post.grain * src.a, src.a);
}
`

/** Fills the fixed uniform array length the WGSL declares. */
export function fieldShader(maxInstances) {
    return FIELD_WGSL.replace('${MAX_INSTANCES}', String(maxInstances))
}
