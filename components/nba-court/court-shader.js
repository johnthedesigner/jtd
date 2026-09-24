/**
 * The court surface shader.
 *
 * The scene is one textured quad, so all of the arena is fragment math:
 *
 *  - The light pool is a soft box in floor space whose edge sits exactly on
 *    the boundary lines. Real house rigs are sharply cut off to keep the bowl
 *    dark, so this is less of a cheat than it looks.
 *  - The reflections are a true mirror of the ceiling rig, not a phong lobe.
 *    The floor is a plane and the fixtures are on a plane, so the reflected
 *    view ray has a closed-form hit point on the ceiling. Sampling the rig's
 *    luminance there gives reflections that stretch toward the viewer the way
 *    a real floor does, for free, because the geometry does the stretching.
 *  - Blur grows with the distance the reflected ray travels, which is what
 *    makes near-camera streaks tight and far ones soft.
 */

import { LIGHT_RIG } from './constants'

/**
 * How fast the ribbon's colour blocks crawl around its perimeter, in feet
 * per second — negative runs the opposite way around the loop (see the
 * winding direction noted on `along`, inside `ribbonRadiance`).
 */
export const RIBBON_SPEED = -4

/** How often every block on the ribbon swaps to a different colour, in seconds. */
export const RIBBON_COLOR_SWAP_SECONDS = 10

export const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec4 vReflectCoord;

    // View-projection of the mirrored camera, with the bias that maps clip
    // space to texture space folded in — so the fragment can divide by w and
    // sample the reflection pass directly. See FloorReflection.js.
    uniform mat4 uReflectMatrix;

    void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vReflectCoord = uReflectMatrix * world;
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

export const fragmentShader = /* glsl */ `
    precision highp float;

    // GLSL ES 1.0 needs a compile-time loop bound, so the count is baked in
    // from LIGHT_RIG rather than duplicated — the two drifting apart would be
    // silent and maddening.
    #define FIXTURES_PER_ROW ${LIGHT_RIG.perRow}
    const float uFixtureCount = ${LIGHT_RIG.perRow}.0;

    uniform sampler2D uReflectMap;
    uniform float uReflectStrength;
    uniform float uReflectBlur;
    // ?reflectdebug=1 shows the mirrored pass raw, with no Fresnel, blur or
    // lighting on top — the only way to tell "the reflection is too dim" from
    // "the projection is wrong", which look identical on the finished floor.
    uniform float uReflectDebug;
    // Black point subtracted from the mirrored pass before it is added in.
    uniform float uReflectBlack;
    // Floor under the scene reflection's Fresnel. Tune with ?reflectminf=.
    uniform float uReflectMinF;
    // How far the floor's own surface normal drags the mirrored sample, and
    // how strongly standing geometry blocks the analytic reflections.
    uniform float uReflectRipple;
    uniform float uReflectOcclude;
    varying vec4 vReflectCoord;

    uniform sampler2D uMap;
    uniform sampler2D uMapPrev;
    uniform float uMix;
    uniform vec2  uCourtHalf;
    uniform float uEdgeFeather;
    uniform float uSpill;
    uniform vec3  uKeyColor;
    uniform float uKey;
    uniform vec3  uAmbientColor;
    uniform float uAmbient;
    uniform float uCenterFalloff;
    uniform float uLightHeight;
    uniform float uRowZ;
    uniform float uInGroupSpacing;
    uniform float uGroupGap;
    uniform float uFixtureRadius;
    uniform float uGroupSize;
    uniform float uSweepSpan;
    uniform float uAimCross;
    uniform float uConeInner;
    uniform float uConeOuter;
    uniform float uCornerRadius;
    uniform float uCeilingFill;
    uniform float uCeilingSpacing;
    uniform float uFillFlatten;
    uniform float uPoolExpand;
    uniform float uRibbonOffset;
    uniform float uRibbonHeight;
    uniform float uRibbonBandHalf;
    uniform float uRibbonBlockSize;
    uniform float uRibbonIntensity;
    uniform float uRibbonSpeed;
    uniform float uRibbonColorSwap;
    uniform vec3  uRibbonPrimary;
    uniform vec3  uRibbonSecondary;
    uniform float uTime;
    uniform float uPaintGrain;
    uniform float uPaintScale;
    uniform vec2  uPlaneHalf;
    uniform sampler2D uGrainMask;
    uniform vec2  uMapSize;
    uniform float uGrainStrength;
    uniform float uRippleAmp;
    uniform float uRippleScale;
    uniform float uMatte;
    uniform float uGlossVar;
    uniform float uRoughness;
    uniform float uSpecular;
    uniform float uGrain;
    uniform float uDebugSpec;

    varying vec2 vUv;
    varying vec3 vWorld;

    const float PI = 3.14159265359;
    const float HALF_PI = 1.5707963268;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    /**
     * Radiance reaching a floor point along its mirror direction, summed over
     * every fixture in both banks.
     *
     * This works per fixture in angle space rather than by intersecting a
     * ceiling plane. The plane approach only works for a rig that covers the
     * whole ceiling: with two narrow banks the mirror ray crosses the light
     * plane some seventy feet past the far sideline, misses both banks, and the
     * floor goes black. Comparing the mirror direction against the direction to
     * each fixture has no such blind spot, and it is what a specular highlight
     * from a finite source actually is.
     *
     * Two independent terms decide a fixture's contribution, and the second is
     * the one that makes this rig worth building:
     *
     *  - whether the mirror direction is pointing at it, which places the
     *    highlight; and
     *  - whether that fixture is aimed at this point, which sets how bright it
     *    is. Because each head in a group is angled differently, neighbouring
     *    reflections come back at visibly different intensities instead of
     *    tiling uniformly.
     */
    float rigRadiance(vec3 P, vec3 R, float lobe) {
        float sum = 0.0;
        // Uneven spacing: tight inside a group, a wider gap between groups.
        float pitch = uGroupSize * uInGroupSpacing + uGroupGap;
        float groups = uFixtureCount / uGroupSize;
        float spanHalf = ((groups - 1.0) * pitch
                        + (uGroupSize - 1.0) * uInGroupSpacing) * 0.5;

        for (int sIdx = 0; sIdx < 2; sIdx++) {
            float side = sIdx == 0 ? -1.0 : 1.0;

            for (int i = 0; i < FIXTURES_PER_ROW; i++) {
                float fi = float(i);
                float grp = floor(fi / uGroupSize);
                float w = fi - grp * uGroupSize;
                float fx = grp * pitch + w * uInGroupSpacing - spanHalf;
                vec3 F = vec3(fx, uLightHeight, side * uRowZ);

                // Aim: successive heads in a group fan along the floor.
                float t = uGroupSize > 1.0 ? w / (uGroupSize - 1.0) : 0.5;
                vec3 target = vec3(
                    fx + (t - 0.5) * uSweepSpan,
                    0.0,
                    -side * uAimCross
                );
                vec3 aim = normalize(target - F);

                vec3 toF = F - P;
                float dist = length(toF);
                vec3 dirF = toF / dist;

                // How squarely this head is pointing at us.
                float spot = smoothstep(uConeOuter, uConeInner, dot(aim, -dirF));
                if (spot <= 0.001) continue;

                // How close the mirror direction is to the head. For small
                // angles the chord length stands in for the angle, which avoids
                // an acos per fixture.
                //
                // Square heads, not round: the offset is measured per axis and
                // combined with a max rather than a length, which is a square
                // in angle space. The blend with the Euclidean distance takes
                // the hard points off the corners, as a real housing has.
                float angRadius = uFixtureRadius / dist;
                vec3 off = dirF - R;
                float ax = abs(off.x);
                float az = abs(off.z);
                float ang = max(max(ax, az), length(vec2(ax, az)) * 0.8);
                float highlight = 1.0 - smoothstep(angRadius * 0.25, angRadius + lobe, ang);

                sum += spot * highlight;
            }
        }
        return sum;
    }

    /**
     * The rest of the ceiling: trusses, catwalks, house fill — everything that
     * is not one of the aimed heads.
     *
     * Needed because the banks alone leave the floor black at a low rake. At a
     * 22 degree camera the mirror direction only reaches light height about a
     * hundred feet out, well past two rows sitting thirty feet off centre, so
     * the ray finds nothing. A real arena ceiling is lit structure from wall to
     * wall, and this stands in for it: dim, broad, and tiled so the ray always
     * lands on something. The aimed heads then read as bright, varying
     * highlights on top of it rather than as the only thing present.
     */
    float ceilingFill(vec3 P, vec3 R, float lobe) {
        float travel = (uLightHeight - P.y) / max(R.y, 0.05);
        vec2 hit = P.xz + R.xz * travel;
        float soft = clamp(lobe * travel, 0.5, 40.0);

        vec2 cell = vec2(uCeilingSpacing);
        vec2 base = floor(hit / cell + 0.5);
        float sum = 0.0;
        for (int i = -1; i <= 1; i++) {
            for (int j = -1; j <= 1; j++) {
                vec2 cellIdx = base + vec2(float(i), float(j));
                // Jittered per cell, not a perfect grid. A regular lattice of
                // identical round pools has a period the eye locks onto —
                // fine on the wood, where the grain's own irregularity breaks
                // it up, but on the flat painted areas nothing else does, and
                // the pattern read as an obviously synthetic tile. Randomising
                // each cell's centre and radius (both from a hash of the cell
                // index, so it stays stable frame to frame) turns it into
                // something that reads as a messy, real ceiling instead.
                vec2 jitter = vec2(hash(cellIdx), hash(cellIdx + 19.7)) - 0.5;
                vec2 c = cellIdx * cell + jitter * cell * 0.7;
                float rScale = 0.55 + hash(cellIdx + 41.3) * 0.9;
                vec2 q = hit - c;
                float d = length(q);
                // Soft round pools, so there is a gradient everywhere for the
                // floor's grain to bend. A flat top would give it nothing.
                sum += pow(max(0.0, 1.0 - d / (uCeilingSpacing * 0.42 * rScale + soft)), 2.0);
            }
        }
        // A wash, not a pattern, but a faint one. The base under it has to
        // stay small: it applies to every pixel of the floor, so a generous
        // value reads as a flat specular lift that washes the colour out of the
        // court — most obviously up close, where the floor fills the frame.
        // Its only job is to keep the floor off pure black between the heads.
        return mix(0.12, 1.0, clamp(sum, 0.0, 1.0));
    }

    float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

    /**
     * TD Garden runs a colour LED ribbon around the balcony front, the whole
     * way round the bowl — used for score, ads and hype graphics during play.
     * Its content does not matter here; what matters is that it is a ring of
     * saturated team colour well above and well outside the court, which real
     * arenas do not otherwise have, and which throws a colourful streak into
     * the reflections that a plain white rig cannot. It is never drawn —
     * exactly like the light banks, it exists only as something the floor
     * reflects.
     *
     * Shaped as a stadium, not an ellipse: dead straight along both sides,
     * parallel to the sidelines, curving only in the two end zones behind
     * each basket — that is an arena bowl's actual footprint, and an ellipse
     * curves along the sides where a real one does not. The straight sides sit
     * at z = ±capR; the ends are semicircles of that same radius, centred a
     * points (±a, 0), so the straight run blends into the curve with no kink.
     *
     * The ray is intersected with all four pieces (two line segments, two
     * circles) and the nearest positive, in-region hit wins — the shape is
     * convex, so there is exactly one such crossing for a ray leaving the
     * court interior.
     */
    // The flat colour for a given point in the white/primary/secondary/primary
    // cycle.
    vec3 ribbonBlockColor(float cyc) {
        return cyc < 1.0 ? vec3(1.0) : (cyc < 2.0 ? uRibbonPrimary : (cyc < 3.0 ? uRibbonSecondary : uRibbonPrimary));
    }

    // The ribbon's colour at one point along its perimeter, sharp edges and
    // all — ribbonRadiance below samples this at several nearby offsets and
    // averages them, which is the actual blur. Broken out so the box-blur
    // loop calls one thing instead of repeating the block-and-detail logic
    // per tap.
    vec3 ribbonSampleColor(float alongPos, float bestSide, float acrossBand) {
        float blockIndex = floor(alongPos / uRibbonBlockSize) + bestSide * 1000.0;

        // Every uRibbonColorSwap seconds, every block jumps to a different
        // colour together — a hard swap on a shared clock, not a fade or a
        // per-block stagger, so it reads as the LED panel being
        // reprogrammed rather than the ribbon suddenly moving differently.
        float epoch = floor(uTime / max(uRibbonColorSwap, 0.001));
        float cyc = mod(blockIndex + epoch, 4.0);
        vec3 col = ribbonBlockColor(cyc);
        bool isWhite = cyc < 1.0;

        // Every second coloured block carries a "detail" texture — a coarse
        // hashed grid standing in for a team wordmark or graphic. Real text
        // would never resolve through a blurred reflection at this distance;
        // what reads instead is the extra high-frequency variation, which is
        // the actual point — a flat block of colour looks like a coloured
        // light, a busy one looks like a screen.
        bool textBlock = mod(floor(blockIndex * 0.5), 2.0) == 0.0;
        if (!isWhite && textBlock) {
            float fracAlong = fract(alongPos / uRibbonBlockSize);
            vec2 cell = floor(vec2(fracAlong * 6.0, acrossBand * 3.0));
            float on = step(0.55, hash(cell + blockIndex * 0.037));
            col = mix(col * 0.5, mix(col, vec3(1.0), 0.7), on);
        }
        return col;
    }

    vec3 ribbonRadiance(vec3 P, vec3 R, float lobe) {
        float capR = uCourtHalf.y + uRibbonOffset;
        float a = max(0.1, uCourtHalf.x + uRibbonOffset - capR);

        vec2 o = P.xz;
        vec2 d = R.xz;

        float bestT = -1.0;
        float bestParam = 0.0;
        float bestSide = 0.0;

        // The two straight sides, z = ±capR, valid for |x| <= a.
        for (int sIdx = 0; sIdx < 2; sIdx++) {
            float sgn = sIdx == 0 ? 1.0 : -1.0;
            if (abs(d.y) > 1e-6) {
                float t = (sgn * capR - o.y) / d.y;
                float hitX = o.x + d.x * t;
                if (t > 0.0 && abs(hitX) <= a && (bestT < 0.0 || t < bestT)) {
                    bestT = t;
                    bestParam = hitX;
                    bestSide = sgn;
                }
            }
        }

        // The two semicircular ends, centred at (±a, 0). Only the outward
        // half of each circle is real ribbon — the inward half is where the
        // straight sides already cover.
        for (int cIdx = 0; cIdx < 2; cIdx++) {
            float sgn = cIdx == 0 ? 1.0 : -1.0;
            vec2 oc = o - vec2(sgn * a, 0.0);
            float A = dot(d, d);
            float B = 2.0 * dot(oc, d);
            float C = dot(oc, oc) - capR * capR;
            float disc = B * B - 4.0 * A * C;
            if (A < 1e-8 || disc < 0.0) continue;
            float sq = sqrt(disc);
            float t1 = (-B - sq) / (2.0 * A);
            float t2 = (-B + sq) / (2.0 * A);
            float t = -1.0;
            if (t2 > 0.0 && (o.x + d.x * t2 - sgn * a) * sgn >= -0.001) t = t2;
            else if (t1 > 0.0 && (o.x + d.x * t1 - sgn * a) * sgn >= -0.001) t = t1;
            if (t > 0.0 && (bestT < 0.0 || t < bestT)) {
                vec2 hitXZ = o + d * t;
                bestT = t;
                bestParam = atan(hitXZ.y - 0.0, (hitXZ.x - sgn * a) * sgn);
                bestSide = sgn * 2.0; // distinguish caps from straight sides
            }
        }

        if (bestT < 0.0) return vec3(0.0);
        vec3 hit = P + R * bestT;

        float soft = clamp(lobe * bestT, 0.3, 25.0);
        float band = 1.0 - smoothstep(uRibbonBandHalf, uRibbonBandHalf + soft, abs(hit.y - uRibbonHeight));
        if (band <= 0.001) return vec3(0.0);

        // A true cumulative arc-length coordinate around the WHOLE
        // perimeter, not just a per-piece parameter signed to point the
        // right way. Each of the four pieces hands back a value in its own
        // local terms (the straight sides a position, the caps an angle),
        // so being consistently *signed* still leaves each piece starting
        // from its own zero — the four pieces agree on which way is
        // "forward" but not on where 0 is, so they meet at the seams with a
        // fixed but arbitrary jump (tens of feet, several block-widths).
        // That is invisible on a static pattern, which is why it went
        // unnoticed, but animated it reads exactly as reported: whichever
        // seams happen to land near a whole number of blocks look
        // stationary, the rest show blocks being cut off and created as
        // they cross. Building along as one running total — each piece
        // picking up exactly where the last one left off — removes the
        // seams from the coordinate entirely, so the pattern scrolls as one
        // unbroken ring.
        //
        // Walking the perimeter this way (start at the top side's +x end,
        // proceed through the top side, the left cap, the bottom side, the
        // right cap, and back) happens to run counterclockwise seen from
        // above; uRibbonSpeed's sign is what actually sets the crawl
        // direction, so this is a one-constant flip if it reads backwards.
        float along;
        if (bestSide == 1.0) {
            along = a - bestParam; // top straight side (z = +capR): a -> -a
        } else if (bestSide == -2.0) {
            along = 2.0 * a + capR * (HALF_PI - bestParam); // left cap
        } else if (bestSide == -1.0) {
            along = 3.0 * a + PI * capR + bestParam; // bottom straight side: -a -> a
        } else {
            along = 4.0 * a + PI * capR + capR * (bestParam + HALF_PI); // right cap
        }
        // The whole pattern scrolls around that perimeter at uRibbonSpeed.
        along += uTime * uRibbonSpeed;

        // Blurred per block, not by blending across each boundary by hand —
        // a handful of samples of the sharp pattern, spread over the same
        // radius that softens the light heads, averaged together. Blending
        // explicitly toward "the other" colour at each edge needs the two
        // sides of a boundary to agree on the crossfade, and any mismatch
        // between them (say, a white block's fade-to-primary not lining up
        // exactly with the primary block's fade-to-white) shows up as a
        // visible seam right at the edge — a blurry margin on each side of a
        // still-hard line, rather than one continuous transition. Sampling
        // and averaging can't disagree with itself.
        //
        // Weighted toward the centre tap (a triangle, not a box) and taken
        // over enough samples that the transition reads as one continuous
        // ramp rather than a handful of visible steps — a box average of
        // only a few taps quantises a smooth gradient into flat bands, which
        // is exactly what read as a rendering artifact, and got more
        // noticeable, not less, once the pattern started scrolling through
        // it at speed.
        float acrossBand = clamp((hit.y - (uRibbonHeight - uRibbonBandHalf)) / (2.0 * uRibbonBandHalf), 0.0, 1.0);
        float blurWidth = clamp(soft, 0.0, uRibbonBlockSize * 0.6);
        const int BLUR_TAPS = 20;
        vec3 col = vec3(0.0);
        float wsum = 0.0;
        for (int k = 0; k < BLUR_TAPS; k++) {
            float t = (float(k) / float(BLUR_TAPS - 1) - 0.5) * 2.0;
            float w = 1.0 - abs(t);
            col += ribbonSampleColor(along + t * blurWidth, bestSide, acrossBand) * w;
            wsum += w;
        }
        col /= wsum;

        return col * band;
    }

    /**
     * The floor's microsurface, derived from the court artwork itself.
     *
     * A perfectly flat plane mirrors a perfectly regular rig, which is most of
     * why the reflections read as CG. The atlas already contains the grain and
     * the board seams, so its luminance gradient is a normal map we get for
     * free — no extra texture, and it lines up with the floor by construction.
     * The gradient is clamped because painted logos have luminance cliffs that
     * would otherwise punch craters into the surface.
     *
     * A second, much lower frequency term stands in for the gentle waviness a
     * sprung floor always has. That is what makes the long streaks wander
     * rather than run dead straight.
     */
    vec3 floorNormal(vec2 uvCoord, vec2 world) {
        // Two octaves of central differences. A single width had to choose
        // between fine grain and plank-scale variation; sampling twice gets
        // both, and the wide tap also steadies the narrow one. Central rather
        // than forward differences, and never a single texel — that reads the
        // atlas's compression noise and turns the floor to glitter.
        vec2 fine = 3.0 / uMapSize;
        vec2 coarse = 7.0 / uMapSize;

        float fx0 = luma(texture2D(uMap, uvCoord - vec2(fine.x, 0.0)).rgb);
        float fx1 = luma(texture2D(uMap, uvCoord + vec2(fine.x, 0.0)).rgb);
        float fy0 = luma(texture2D(uMap, uvCoord - vec2(0.0, fine.y)).rgb);
        float fy1 = luma(texture2D(uMap, uvCoord + vec2(0.0, fine.y)).rgb);

        float cx0 = luma(texture2D(uMap, uvCoord - vec2(coarse.x, 0.0)).rgb);
        float cx1 = luma(texture2D(uMap, uvCoord + vec2(coarse.x, 0.0)).rgb);
        float cy0 = luma(texture2D(uMap, uvCoord - vec2(0.0, coarse.y)).rgb);
        float cy1 = luma(texture2D(uMap, uvCoord + vec2(0.0, coarse.y)).rgb);

        float fdx = (fx1 - fx0) * 0.5;
        float fdy = (fy1 - fy0) * 0.5;
        float cdx = (cx1 - cx0) * 0.5;
        float cdy = (cy1 - cy0) * 0.5;

        // Reject edges per-octave rather than on the combined gradient.
        //
        // A single combined test suppressed grain wherever EITHER octave saw an
        // edge, and the coarse octave reaches seven texels — about half a foot.
        // So every painted line drew a half-foot band of dead, flat wood either
        // side of itself, most visibly around the three-point line and the
        // free-throw circle. Tested separately, the fine octave keeps its grain
        // right up to the stroke and only the wide tap backs off.
        float fineEdge = 1.0 - smoothstep(0.2, 0.42, max(abs(fdx), abs(fdy)));
        float coarseEdge = 1.0 - smoothstep(0.1, 0.26, max(abs(cdx), abs(cdy)));

        float dx = fdx * 0.7 * fineEdge + cdx * 0.5 * coarseEdge;
        float dy = fdy * 0.7 * fineEdge + cdy * 0.5 * coarseEdge;

        // Where the floor is bare wood, from the prepass in court-grain.js.
        // Local contrast cannot answer this: paint edges are the highest
        // contrast in the atlas, so keying on it ramped grain up along every
        // lane marker instead of down. The mask is hue-derived and eroded back
        // from every paint boundary, so edges get no perturbation at all.
        float wood = texture2D(uGrainMask, uvCoord).r;

        float grain = uGrainStrength * wood;

        // Painted areas have no texture in the atlas to derive a normal from,
        // so they came out as a perfect plane and the reflected heads sat on
        // them as clean round blobs. But paint on a real court is laid over the
        // same boards — the plank structure is still physically there, just
        // smoothed under the coating. So the paint gets a synthesised plank
        // field instead of nothing, at a fraction of the wood's amplitude. It
        // is not the real grain, and it does not have to be — it only has to
        // stop the surface being mathematically flat.
        //
        // Real NBA hardwood is laid with the boards running the length of the
        // court, parallel to the sidelines — so a board's long edges, and the
        // grain within it, both run along world X. A component that varies
        // only with X is constant across the full length of a board — its
        // contour lines run along X too, which is the correct orientation.
        // The first version had this backwards: it drove the fine grain from
        // X, which produces ridges constant along X *for a fixed X*, i.e.
        // elongated across Z — parallel to the baselines instead. Both the
        // board seams and the grain within them are driven by Z here, so
        // both read as running the length of the court.
        float paint = 1.0 - wood;

        // Twice the previous density.
        float plankFreq = 0.84 * uPaintScale;
        float coord = world.y * plankFreq;
        float board = floor(coord);
        float seamPhase = coord * 6.28318;

        // The fine grain sits inside each board, at several times the seam
        // frequency, with its own per-board phase and frequency so no two
        // boards read alike — it is deliberately irregular along the length
        // too (via a coarse segment index along X), the way real grain has
        // knots and whorls rather than repeating like a barcode.
        float lenSeg = floor(world.x * 0.12 * uPaintScale);
        float grainJitter = hash(vec2(lenSeg, board + 3.7)) * 30.0;
        float grainMul = 2.6 + hash(vec2(lenSeg, board + 9.1)) * 2.2;
        float boardAmp = 0.55 + 0.45 * hash(vec2(board, lenSeg + 5.3));
        float grainPhase = coord * grainMul + grainJitter;

        // Normalised by the highest frequency present, so paintGrain is in the
        // same units as grainStrength and the two compare directly. Without
        // that the derivative terms scale with frequency and the paint came out
        // an order of magnitude stronger than the wood.
        float norm = 6.28318 * plankFreq * grainMul;
        float pdx = 0.0;
        float pdz = (cos(seamPhase) * (6.28318 * plankFreq) * 0.45
                   + cos(grainPhase) * (6.28318 * plankFreq * grainMul) * boardAmp * 0.55) / norm;
        float paintAmp = uPaintGrain * paint;
        // Measured on the atlases: wood gradients run about 0.016 median,
        // 0.05 at the 90th percentile. Clipping here keeps the top few percent
        // from throwing their reflection far across the ceiling and speckling.
        dx = clamp(dx, -0.05, 0.05);
        dy = clamp(dy, -0.05, 0.05);

        // Baseline ripple, deliberately NOT masked to wood. A sprung floor is
        // laid over a subframe and is never truly flat, and the painted areas
        // ride the same undulation as the boards. Without this the keys read as
        // a perfect plane, which is the one part of the floor that always
        // looked synthetic. uRippleScale is a wavelength in feet, so it can be
        // reasoned about as "a roll every N feet".
        float w = 6.28318 / max(uRippleScale, 0.5);
        float rx = cos(world.x * w) * 0.62
                 + cos((world.x * 0.41 + world.y * 0.27) * w) * 0.38;
        float ry = cos(world.y * w * 1.07) * 0.62
                 + cos((world.y * 0.44 - world.x * 0.19) * w) * 0.38;

        // v runs along -Z, which is why dy is negated back into world space.
        return normalize(vec3(
            -dx * grain - rx * uRippleAmp - pdx * paintAmp,
            1.0,
             dy * grain - ry * uRippleAmp - pdz * paintAmp
        ));
    }


    /**
     * What the scene itself puts into the floor, from the mirrored render
     * pass — everything the analytic terms above can't know about: the
     * hoops and stanchions, the courtside chairs, the floor markers, and
     * the scoreboard numerals standing behind the seats.
     *
     * The analytic rig and ribbon stay exactly as they were. They describe
     * things that are never drawn at all (the light banks, the LED ring),
     * so a geometric pass has nothing to say about them; this adds what is
     * actually in the room rather than replacing what isn't.
     *
     * Blurred by the same roughness lobe the rig reflection uses, so a
     * matte floor scatters the scene as much as it scatters the fixtures.
     * Four taps on a small cross rather than a real kernel: the source is
     * already half-resolution and heavily attenuated by Fresnel, and the
     * difference from a wider blur doesn't survive that.
     */
    vec3 sceneReflection(float lobe, vec3 N, out float coverage) {
        coverage = 0.0;
        // Behind the mirror plane, or degenerate: nothing to show.
        if (vReflectCoord.w <= 0.0) return vec3(0.0);
        vec2 flat_uv = vReflectCoord.xy / vReflectCoord.w;
        if (flat_uv.x < 0.0 || flat_uv.x > 1.0 || flat_uv.y < 0.0 || flat_uv.y > 1.0) {
            return vec3(0.0);
        }

        // Coverage is read off the *unrippled* sample. It is a mask, not an
        // image: displacing it puts the occlusion edge somewhere the
        // geometry is not, and because the floor's normal carries the
        // wood's own high-frequency grain, a ripple large enough to be worth
        // having turned the mask into speckle scattered across the court.
        // Reading it flat is what lets the colour below ripple freely.
        coverage = texture2D(uReflectMap, flat_uv).a;

        // Drag the colour with the floor's own normal, exactly as the
        // analytic terms are dragged by it. Without this the scene
        // reflection is a flat mirror lying on a floor whose every other
        // reflection breaks up with the grain, and it reads as a decal.
        vec2 uv = flat_uv + vec2(N.x, N.z) * uReflectRipple;
        uv = clamp(uv, vec2(0.0), vec2(1.0));

        float r = uReflectBlur * (0.35 + lobe * 6.0);
        vec3 sum = texture2D(uReflectMap, uv).rgb;
        sum += texture2D(uReflectMap, uv + vec2(r, 0.0)).rgb;
        sum += texture2D(uReflectMap, uv + vec2(-r, 0.0)).rgb;
        sum += texture2D(uReflectMap, uv + vec2(0.0, r)).rgb;
        sum += texture2D(uReflectMap, uv + vec2(0.0, -r)).rgb;
        sum /= 5.0;

        // The mirrored pass also contains the empty background of the room,
        // and adding that back into the floor is double-counting: the dark
        // arena around the court is already in the ambient term, so it
        // arrived here as a flat lift across the whole floor that washed the
        // wood out while the things actually standing in the room stayed
        // invisible. Subtracting the background level and renormalising
        // keeps only what is genuinely brighter than the room — the
        // scoreboard, the hoops, the floor markers.
        sum = max(sum - uReflectBlack, vec3(0.0)) / max(1.0 - uReflectBlack, 0.001);

        // The target holds already-tonemapped, gamma-encoded pixels (every
        // material in this scene runs its own colorspace include — same
        // reason PostFX doesn't re-tonemap). This shader works in linear
        // light, so decode before mixing in.
        return pow(sum, vec3(2.2));
    }

    void main() {
        // Courts cross-dissolve on a switch, so the two atlases are blended
        // before any lighting runs.
        vec4 tex = mix(texture2D(uMapPrev, vUv), texture2D(uMap, vUv), uMix);
        if (tex.a < 0.004) discard;

        // The texture is uploaded raw, so decode sRGB here and let the
        // colorspace include re-encode at the end.
        vec3 albedo = pow(tex.rgb, vec3(2.2));

        vec2 p = vWorld.xz;

        // --- Light pool: full brightness over the court, gone at the lines.
        //
        // A rounded box rather than a hard one. Two banks of angled spots do
        // not throw a rectangle with sharp corners — the corners are where the
        // fewest cones overlap, so they fall away first and they fall away
        // curved.
        vec2 d = abs(p) - (uCourtHalf + vec2(uPoolExpand) - vec2(uCornerRadius));
        float edge = length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - uCornerRadius;
        float pool = 1.0 - smoothstep(-uEdgeFeather, uEdgeFeather, edge);

        // A little bounce onto the apron so the cut is not a hard stencil.
        float spill = uSpill * exp(-max(edge, 0.0) * 0.075);

        // Gentle hot-centre gradient so the pool is not a flat wash.
        float radial = length(p / uCourtHalf);
        float shaped = 1.0 - uCenterFalloff * smoothstep(0.0, 1.35, radial);

        vec3 lit = uAmbientColor * uAmbient
                 + uKeyColor * uKey * (pool * shaped + spill);

        vec3 diffuse = albedo * lit;

        // --- Mirror reflection of the rig, off a surface that is not perfectly flat.
        vec3 N = floorNormal(vUv, p);
        vec3 V = normalize(cameraPosition - vWorld);
        float NdotV = clamp(dot(N, V), 0.0, 1.0);
        vec3 R = reflect(-V, N);

        // Matte finish. A duller seal scatters the reflection rather than
        // mirroring it, so the lobe widens and its peak drops — both together,
        // because widening alone would just make a big soft bright patch and
        // dimming alone would keep the sharp edges of a gloss finish. In angle
        // space the lobe is simply the roughness.
        float lobe = uRoughness * (1.0 + uMatte * 14.0);
        float headLum = rigRadiance(vWorld, R, lobe);
        float fillLum = ceilingFill(vWorld, R, lobe) * uCeilingFill;
        vec3 ribbonLum = ribbonRadiance(vWorld, R, lobe);

        // Schlick, with the low F0 of a sealed wood floor. Grazing angles do
        // most of the work, which is why the far half of the court shines.
        float F = 0.028 + 0.972 * pow(1.0 - NdotV, 5.0);

        // Sealed lines and logos are a touch glossier than open grain — the
        // one thing besides the light pool that makes the finish non-uniform,
        // and it keys on albedo brightness rather than on the paint mask. Set
        // uGlossVar to 0 for a perfectly even finish across the whole floor.
        float glossVar = smoothstep(0.35, 0.8, dot(albedo, vec3(0.33))) - 0.5;
        float gloss = 1.0 + uGlossVar * glossVar * 0.3;

        // Keep the sheen on the lit floor. The apron would physically mirror
        // the same ceiling, but letting it shine as hard as the court flattens
        // the pool edge that the whole shot depends on.
        // Keyed to the pool alone, not the spill. Letting bounce light drive
        // the sheen too makes the apron halo as the falloff widens.
        float sheenMask = mix(0.05, 1.0, pool);

        // The heads and the fill take different Fresnel, which is why the fill
        // looked so much stronger up close.
        //
        // Schlick's fifth power climbs steeply at grazing angles, and a low
        // near camera puts far more of the floor at a grazing angle than a high
        // distant one — measured across these two views, the peak roughly
        // doubles and the value at centre court triples. The aimed heads should
        // do that: small bright sources really do flare when you look along a
        // floor. The fill should not. It stands in for a broad dim ceiling, and
        // a large diffuse source has its energy spread over a wide solid angle
        // rather than concentrated where the mirror points. Left on full
        // Fresnel it washed the colour out of the court in the close view.
        float fillF = mix(F, 0.045, uFillFlatten);
        float energy = headLum * F + fillLum * fillF;

        vec3 spec = uKeyColor * (energy * uSpecular * gloss * sheenMask * mix(1.0, 0.3, uMatte));

        // The ribbon gets its own intensity, deliberately not tied to
        // uSpecular. Every house-light court view (shot map especially) dims
        // uSpecular to keep the overlay legible, and if the ribbon dimmed with
        // it there would be nothing colourful left to pop against the dark
        // floor — the one place this was explicitly meant to read.
        vec3 ribbonSpec = ribbonLum * F * uRibbonIntensity * gloss * sheenMask;
        spec += ribbonSpec;

        // Fresnel with a floor under it, unlike the rig reflection. Schlick
        // gives about 0.03 across most of the court and only climbs at
        // grazing angles, which is right for a mirror of very bright light
        // fixtures and useless for a mirror of an ordinary dim object: the
        // scoreboard reflection simply vanished everywhere but the far edge.
        // Safe to flatten here precisely because the background has already
        // been subtracted to zero above — raising the response can only
        // bring up things genuinely standing in the room, never the empty
        // floor around them.
        //
        // Not masked by the light pool either: the scoreboard stands well
        // outside it, and appearing in the floor is the whole point.
        float sceneF = max(F, uReflectMinF);
        float coverage = 0.0;
        vec3 sceneRefl = sceneReflection(lobe, N, coverage);

        // Anything standing above the floor is between this point and the
        // ceiling along the mirror direction, so it blocks the rig and
        // ribbon reflections that would otherwise come back from up there.
        // The scoreboard is the reason this exists — it is large, close to
        // the floor's far edge, and its absence from the reflection was the
        // last thing making it read as pasted on.
        spec *= 1.0 - coverage * uReflectOcclude;

        spec += sceneRefl * sceneF * uReflectStrength * gloss
                * mix(1.0, 0.35, uMatte);

        // ?debug=spec renders the reflection field alone. Bright hardwood
        // hides a great deal, and being able to look at the specular term on
        // its own is what finally settled why the grain was not showing.
        vec3 color = mix(diffuse + spec, spec, uDebugSpec);

        // Dither, or the pool's shoulder bands on a dark floor.
        color += (hash(gl_FragCoord.xy) - 0.5) * uGrain;

        // The atlas ends in a hard rectangle. Fade its outer few feet so the
        // apron dissolves into the bowl floor rather than showing a seam.
        vec2 fade = 1.0 - smoothstep(uPlaneHalf - 7.0, uPlaneHalf - 0.5, abs(p));
        float alpha = tex.a * min(fade.x, fade.y);

        // 2 = the scene-reflection contribution alone, exactly as added to
        // the floor below. Answers "is it landing where it should and how
        // strong is it" without the lit wood hiding the answer.
        if (uReflectDebug > 1.5) {
            float dbgCoverage = 0.0;
            vec3 contrib = sceneReflection(lobe, N, dbgCoverage) * max(F, uReflectMinF)
                         * uReflectStrength * gloss * mix(1.0, 0.35, uMatte);
            gl_FragColor = vec4(pow(contrib, vec3(1.0 / 2.2)), 1.0);
            return;
        }

        if (uReflectDebug > 0.5) {
            vec2 ruv = vReflectCoord.xy / max(vReflectCoord.w, 0.0001);
            vec3 raw = texture2D(uReflectMap, ruv).rgb;
            bool inside = vReflectCoord.w > 0.0 && ruv.x >= 0.0 && ruv.x <= 1.0
                       && ruv.y >= 0.0 && ruv.y <= 1.0;
            // Out-of-bounds shows as magenta, so a projection that misses the
            // target is unmistakable rather than just dark.
            gl_FragColor = vec4(inside ? raw : vec3(1.0, 0.0, 1.0), 1.0);
            return;
        }

        gl_FragColor = vec4(color, alpha);

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

/** Matches the uniform block above; tuned against screenshots, not physics. */
export function defaultUniformValues() {
    return {
        /**
         * How much of the mirrored scene pass lands in the floor. Well under
         * 1: the analytic rig reflection is already carrying the floor's
         * shine, and this is meant to add the *objects in the room* on top
         * of it, not to restate the lighting. Tune with ?reflect=.
         */
        reflectStrength: 2.2,
        /**
         * Blur radius in reflection-target UV, scaled by roughness. Small:
         * the target is already half-resolution, and the reflected shapes
         * are the point — smeared much further they stop reading as the
         * scoreboard and become a general sheen.
         */
        reflectBlur: 0.0016,
        reflectDebug: 0,
        /** Roughly the arena background's own level. Tune with ?reflectblack=. */
        reflectBlack: 0.1,
        reflectMinF: 0.22,
        /**
         * How far the floor's normal drags the mirrored sample, in *UV*.
         * Tiny by necessity: the whole texture spans 0..1, so a value near
         * 1 smears the sample across the entire frame and turns the
         * coverage mask into speckle. Tune with ?reflectripple=.
         */
        reflectRipple: 0.13,
        /** Tune with ?reflectocclude=. */
        reflectOcclude: 0.6,
        edgeFeather: 2.6,
        spill: 0.11,
        // Deliberately lower than looks right on its own. Lit harder, bare
        // wood sits at ~0.76 on the display curve, where ACES compresses hard
        // and a reflection can only move it a few percent — measured, the same
        // highlight reads seven times stronger on a dark painted key than on
        // wood. Pulling the floor down the curve is what lets the reflections
        // read on wood at all; the specular makes up the brightness.
        key: 0.62,
        keyColor: '#fff4e2',
        ambient: 0.055,
        ambientColor: '#4a5a78',
        centerFalloff: 0.34,
        // Blur radius is roughness x travel, and the reflected ray covers
        // about eighty feet at this rake — so this is far smaller than a
        // surface-roughness figure would suggest. Blurred much beyond the
        // fixtures' own width the light field flattens out, and the floor's
        // grain has nothing left to modulate.
        roughness: 0.0085,
        // House lights are HDR-bright. At a 30 degree rake Fresnel on a sealed
        // floor is only about 0.06, so a fixture near 1.0 contributes nothing
        // visible; giving it a real intensity and letting ACES roll it off is
        // what turns the sheen back on.
        specular: 10,

        /**
         * How hard the wood's own grain bends the reflection. Small, because
         * the lever arm is enormous: over an eighty-foot path a normal tilted
         * by a degree walks the reflection several feet across the ceiling.
         * Masked to bare wood. Tune with ?grain=
         */
        grainStrength: 0.5,

        /**
         * Finish. 0 is mirror gloss, 1 is fully scattered. Widens the
         * reflection lobe and drops its peak together. Tune with ?matte=
         */
        matte: 0.4,

        /** How far the light pool's corners round off, in feet. ?corner= */
        cornerRadius: 9,

        /** Pushes the whole pool outward past the boundary lines. ?expand= */
        poolExpand: 3,

        /**
         * The colour LED ribbon around the balcony, modelled purely as a
         * reflection source. Offset and height put it well outside and well
         * above the court; segments controls how chunky its colour pattern
         * reads in the reflection. Intensity is independent of uSpecular so it
         * keeps popping when the house lights dim. ?ribbonoffset= ?ribbonheight=
         * ?ribbonband= ?ribbonblock= ?ribbon= ?ribbonspeed= ?ribbonswap=
         */
        ribbonOffset: 55,
        ribbonHeight: 34,
        ribbonBandHalf: 0.05,
        /** Block size along the ribbon's perimeter, in feet. ?ribbonblock= */
        ribbonBlockSize: 20,
        ribbonIntensity: 4,
        ribbonSpeed: RIBBON_SPEED,
        ribbonColorSwap: RIBBON_COLOR_SWAP_SECONDS,

        /**
         * Synthetic plank texture for painted areas, which have no grain in the
         * atlas to derive one from. Deliberately far weaker than the wood.
         * ?paintgrain= and ?paintscale=
         */
        paintGrain: 0.008,
        paintScale: 1.0,

        /**
         * The dim, broad ceiling the aimed heads sit in front of. Without it
         * the floor goes black at low camera rakes — see ceilingFill().
         * ?fill= and ?fillspacing=
         */
        ceilingFill: 0.2,
        ceilingSpacing: 14,

        /**
         * How far the fill's Fresnel is flattened toward a constant. 0 leaves
         * it behaving like a mirror-sharp source and flaring at grazing angles;
         * 1 makes it view-independent. ?fillflatten=
         */
        fillFlatten: 0.85,

        /**
         * How much the finish varies with the artwork's own brightness.
         * 1 keeps sealed lines glossier than open grain; 0 makes matte and
         * specular perfectly uniform across the floor. Tune with ?glossvar=
         */
        glossVar: 1.0,

        /**
         * Baseline undulation of the whole floor, paint included — a sprung
         * floor laid over a subframe is never flat. Amplitude is a normal
         * tilt; scale is the wavelength in feet, so it reads as "a roll every
         * N feet". Tune with ?ripple= and ?ripplescale=
         */
        rippleAmp: 0.001,
        rippleScale: 16,

        /** Dither, to stop the light pool banding on a dark floor. */
        grain: 0.012,
    }
}

/**
 * A fingerprint of this module's shader source and default values.
 *
 * Editing a shader does not reach an open page on its own: three caches the
 * compiled GPU program, and the uniforms are memoised on mount, so a hot update
 * swaps the source strings while the floor keeps running the old program with
 * the old numbers. The page looks frozen while the file on disk has changed,
 * which is a genuinely miserable thing to debug — it makes every edit look like
 * it did nothing.
 *
 * Keying the court surface on this forces a remount whenever the source really
 * changes, so hot updates actually take effect. It is a hash rather than a
 * nonce so unrelated hot updates do not needlessly rebuild the material.
 */
export const SHADER_SIGNATURE = (() => {
    const source = vertexShader + fragmentShader + JSON.stringify(defaultUniformValues())
    let h = 5381
    for (let i = 0; i < source.length; i++) {
        h = ((h << 5) + h + source.charCodeAt(i)) | 0
    }
    return `s${(h >>> 0).toString(36)}`
})()
