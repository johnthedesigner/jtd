import * as THREE from 'three'
import { PALETTE } from './palette'
import { COURT, RUNOFF_BASELINE, RUNOFF_SIDE } from './serve-court'
import { buildCourtMark, MARK_SET_BACK } from './serve-mark'
import { courtSurface } from './serve-textures'

/**
 * The building: court, net, walls, stands and the overhead rig.
 *
 * Built imperatively into one `THREE.Group` rather than as JSX. The stands
 * alone are 88 boxes from a four-line loop, and writing those as elements
 * would turn a shape you can read into a wall of markup you cannot. Nothing
 * here changes once it is built — the serve moves, the arena does not — so
 * there is no reconciliation to gain by making it declarative.
 *
 * Ported from the prototype rather than re-derived, dimensions included.
 * Everything is in metres.
 */

export { SCENE_BG, FOG_COLOR } from './palette'

/*
  One hue family, at 196 degrees.

  Everything here was between 211 and 215 — blue, and far enough from cyan
  that the dark shades read as grey rather than as a colour. The surround in
  particular sat at 29% value, which on a dark scene is close enough to
  black that its hue stopped registering at all. The two court shades are
  the same cyan-blue a step apart in value rather than half the scale
  apart — a real court's run-off is the same acrylic in a second shade, not
  a different surface. The perimeter still drops well below both, because
  the walls genuinely are in shadow.
*/
const COLORS = {
    courtIn: '#209ac7',
    courtOut: '#187299',
    // Printed on a matte surface, not made of light. At full white the
    // lines read as a solid material laid into the court rather than as
    // paint on top of it.
    courtLine: '#b9c4c9',
    wall: 0x14303b,
    cap: 0x305461,
    band: 0x0f2933,
    bandGlow: 0x2a96bd,
    stand: 0x0b0d10,
    floor: 0x07090c,
    post: 0x1f3a2c,
    net: 0x111111,
    spot: 0xfff1dc,
    key: 0xfff4e8,
    skyFill: 0x9fc4d4,
    groundFill: 0x07121a,
}

/**
 * Six lamps in a ring around the court, the way an arena is actually lit.
 *
 * This has been wrong twice. First it was ten lamps 24 m straight up, which
 * lights a figure's head and shoulders and leaves a hard terminator down
 * every round limb. Then it was eight around the perimeter — better angle,
 * but every station sat *down court* from the baseline, so the server, who
 * stands behind it, was lit from one side and read as backlit from half the
 * camera positions.
 *
 * The fix is a ring that encloses the subject rather than facing it. Six
 * lamps at equal azimuth around the court's centre, far enough out that the
 * server at one end is well inside the ring, so light reaches them from
 * every direction including behind the baseline. No one lamp dominates, and
 * with six overlapping there is no direction a shadow can be harsh in.
 */
/*
  Low and wide, not high and tight.

  Intensity turned out to be the wrong lever: at every level tried, the
  figure settled at about 40% of the court's brightness, because a floor
  lit from 32 degrees above takes far more of that light per square metre
  than a standing figure does. Dropping the lamps to 18 degrees roughly
  doubles the ratio — a vertical surface now faces them almost squarely
  while the court is raked. The scene is lit for the subject, which is what
  an arena's lower tier of lamps is for.
*/
export const RIG = { radius: 21, height: 7, intensity: 1050, lamps: 6, angle: 0.78 }

export const FOG_DENSITY = 0.042

/** Line width on court, in metres. Real ones are 50 mm. */
const LINE_WIDTH = 0.05

/**
 * A faint additive cone under each lamp, standing in for haze in the air.
 *
 * Brightest at the lamp and fading toward the floor (`vY`), and edge-on
 * rather than face-on (the `dot(normal, view)` term), so the cone reads as
 * a volume of lit air rather than as a solid shape with a hard silhouette.
 */
function hazeMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
            c: { value: new THREE.Color(COLORS.spot) },
            k: { value: 0.4 },
        },
        vertexShader: `
            varying float vY; varying vec3 vN; varying vec3 vV;
            void main() {
                vY = uv.y;
                vec4 mv = modelViewMatrix * vec4(position, 1.0);
                vN = normalize(normalMatrix * normal);
                vV = normalize(-mv.xyz);
                gl_Position = projectionMatrix * mv;
            }`,
        fragmentShader: `
            uniform vec3 c; uniform float k;
            varying float vY; varying vec3 vN; varying vec3 vV;
            void main() {
                float f = pow(abs(dot(vN, vV)), 2.5);
                float a = k * pow(vY, 1.6) * f;
                gl_FragColor = vec4(c * a, a);
            }`,
    })
}

export function buildServeArena(frame) {
    const { courtPoint, forward, right, up, centreMark, origin, ground } = frame
    const root = new THREE.Group()
    const disposables = []
    const track = (x) => (disposables.push(x), x)

    const material = (opts) =>
        track(new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...opts }))

    /*
      Both court surfaces share one set of maps. They are the same material
      in reality — the same acrylic, laid in two colours — so the grain
      should run continuously across the line between them rather than
      changing character at the sideline.
    */
    const grain = courtSurface()
    const surfaceMat = material({
        color: COLORS.courtOut, roughness: 0.95,
        map: grain.map, roughnessMap: grain.roughnessMap,
        normalMap: grain.normalMap, normalScale: new THREE.Vector2(0.07, 0.07),
    })
    const insideMat = material({
        color: COLORS.courtIn, roughness: 0.95,
        map: grain.map, roughnessMap: grain.roughnessMap,
        normalMap: grain.normalMap, normalScale: new THREE.Vector2(0.07, 0.07),
    })
    const lineMat = material({ color: COLORS.courtLine, roughness: 0.94 })

    // ---- court surfaces -------------------------------------------------

    /**
     * A flat quad from four world points, wound as two triangles.
     *
     * `uv` is given in court metres rather than 0..1, so the surface grain
     * tiles at the same physical size on the 11 m court and the 44 m
     * surround. Normalised UVs would stretch it to twice the scale on one
     * of them, which is exactly the tell a grain texture is there to avoid.
     */
    // One unit of UV is one metre of court. Each texture then sets its own
    // `repeat` for the scale it works at, which is what lets millimetre
    // grit and metres-wide fading share a single set of coordinates.
    const TILE = 1
    const quad = (pts, mat, uv) => {
        const g = track(new THREE.BufferGeometry())
        const p = []
        for (const i of [0, 1, 2, 0, 2, 3]) p.push(pts[i].x, pts[i].y, pts[i].z)
        g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
        if (uv) {
            const u = []
            for (const i of [0, 1, 2, 0, 2, 3]) u.push(uv[i][0] / TILE, uv[i][1] / TILE)
            g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2))
        }
        g.computeVertexNormals()
        const mesh = new THREE.Mesh(g, mat)
        mesh.material.side = THREE.DoubleSide
        mesh.receiveShadow = true
        root.add(mesh)
        return mesh
    }

    const SX = COURT.HALF_WIDTH + RUNOFF_SIDE
    const D0 = -RUNOFF_BASELINE
    const D1 = COURT.LENGTH + RUNOFF_BASELINE

    quad(
        [courtPoint(-SX, D0), courtPoint(SX, D0), courtPoint(SX, D1), courtPoint(-SX, D1)],
        surfaceMat,
        [[-SX, D0], [SX, D0], [SX, D1], [-SX, D1]]
    )
    // Lifted a millimetre, and the lines two, so the three surfaces never
    // fight for the same depth.
    const W = COURT.HALF_WIDTH
    quad(
        [
            courtPoint(-W, 0, 0.003),
            courtPoint(W, 0, 0.003),
            courtPoint(W, COURT.LENGTH, 0.003),
            courtPoint(-W, COURT.LENGTH, 0.003),
        ],
        insideMat,
        [[-W, 0], [W, 0], [W, COURT.LENGTH], [-W, COURT.LENGTH]]
    )

    const line = (s1, d1, s2, d2) => {
        // 6 mm rather than 2: still flush to the eye at any camera this
        // page uses, and far enough to survive the depth buffer.
        const a = courtPoint(s1, d1, 0.006)
        const b = courtPoint(s2, d2, 0.006)
        const dir = new THREE.Vector3().subVectors(b, a).normalize()
        /*
          Each line runs half its own width past both ends.

          Every line is a quad centred on its centreline, so two meeting at
          a corner each stop half a width short of it and leave a notch cut
          out of the outside of the corner. On a real court the paint is
          laid in overlapping passes and the corner is square. Overrunning
          costs nothing — the overlap is hidden under the other line.
        */
        const over = dir.clone().multiplyScalar(LINE_WIDTH / 2)
        a.sub(over)
        b.add(over)
        const n = new THREE.Vector3().crossVectors(dir, up).multiplyScalar(LINE_WIDTH / 2)
        quad([a.clone().add(n), b.clone().add(n), b.clone().sub(n), a.clone().sub(n)], lineMat)
    }

    const S = COURT.HALF_SINGLES
    const L = COURT.LENGTH
    const SV = COURT.SERVICE_LINE
    ;[
        [-W, 0, W, 0], [-W, L, W, L],               // baselines
        [-W, 0, -W, L], [W, 0, W, L],               // doubles sidelines
        [-S, 0, -S, L], [S, 0, S, L],               // singles sidelines
        [-S, SV, S, SV], [-S, L - SV, S, L - SV],   // service lines
        [0, SV, 0, L - SV],                         // centre service line
        [0, 0, 0, 0.1], [0, L - 0.1, 0, L],         // centre marks
    ].forEach((l) => line(...l))

    // ---- net ------------------------------------------------------------

    /*
      The net, as a real one hangs.

      It was three triangles between the posts and a tube along the top,
      which gives the right silhouette and nothing else. A real net has a
      black band stitched along its bottom edge and a white strap pulling
      the middle down to the regulation 0.914 m.

      Built as a grid so the sag can be a curve rather than a straight
      interpolation between three known heights. An earlier pass added
      noise to that curve for unevenness, which mostly landed on the tape —
      and the tape is the one part that genuinely is taut and smooth. It is
      also out of focus whenever it is in frame. Rolled back.
    */
    const NET_COLUMNS = 60
    const NET_ROWS = 10
    const HEM = 0.055

    const netMat = track(
        new THREE.MeshStandardMaterial({
            color: COLORS.net,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            roughness: 0.9,
        })
    )
    const hemMat = track(
        new THREE.MeshStandardMaterial({ color: 0x0c0d0f, side: THREE.DoubleSide, roughness: 0.85 })
    )
    const strapMat = track(
        new THREE.MeshStandardMaterial({ color: 0xe8ebec, side: THREE.DoubleSide, roughness: 0.75 })
    )

    const NH = COURT.NET_HALF
    const ND = COURT.NET_DISTANCE
    {
        const topAt = (sideways) => {
            const u = Math.abs(sideways) / NH
            // Closer to a catenary than a straight line between the ends.
            const sag = COURT.NET_POST_HEIGHT - COURT.NET_CENTRE_HEIGHT
            return COURT.NET_CENTRE_HEIGHT + sag * (u * u * 0.72 + u * 0.28)
        }

        const positions = []
        const index = []
        for (let c = 0; c <= NET_COLUMNS; c++) {
            const sideways = -NH + (2 * NH * c) / NET_COLUMNS
            const top = topAt(sideways)
            for (let r = 0; r <= NET_ROWS; r++) {
                const p = courtPoint(sideways, ND, (top * r) / NET_ROWS)
                positions.push(p.x, p.y, p.z)
            }
        }
        for (let c = 0; c < NET_COLUMNS; c++) {
            for (let r = 0; r < NET_ROWS; r++) {
                const a = c * (NET_ROWS + 1) + r
                const b = a + NET_ROWS + 1
                index.push(a, b, a + 1, b, b + 1, a + 1)
            }
        }
        const g = track(new THREE.BufferGeometry())
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        g.setIndex(index)
        g.computeVertexNormals()
        root.add(new THREE.Mesh(g, netMat))

        // The black hem along the bottom, and the tape along the top.
        const band = (height, thickness, mat) => {
            const pts = []
            const idx = []
            for (let c = 0; c <= NET_COLUMNS; c++) {
                const sideways = -NH + (2 * NH * c) / NET_COLUMNS
                const top = height === 'top' ? topAt(sideways) : thickness
                const low = height === 'top' ? top - thickness : 0
                pts.push(...courtPoint(sideways, ND, low).toArray())
                pts.push(...courtPoint(sideways, ND, top).toArray())
            }
            for (let c = 0; c < NET_COLUMNS; c++) {
                const a = c * 2
                idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1)
            }
            const bg = track(new THREE.BufferGeometry())
            bg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
            bg.setIndex(idx)
            bg.computeVertexNormals()
            root.add(new THREE.Mesh(bg, mat))
        }
        band('bottom', HEM, hemMat)
        band('top', 0.055, track(new THREE.MeshStandardMaterial({
            color: 0xf2f4f5, side: THREE.DoubleSide, roughness: 0.7,
        })))

        /*
          The centre strap: the white band that pulls the middle of the net
          down to 0.914 m. Without it the net reads as a curtain hung
          between two posts, which is what it looked like.
        */
        const strapW = 0.025
        const strap = []
        const strapIdx = []
        for (const sign of [-1, 1]) {
            const base = strap.length / 3
            strap.push(...courtPoint(sign * strapW, ND, 0).toArray())
            strap.push(...courtPoint(sign * strapW, ND, COURT.NET_CENTRE_HEIGHT + 0.012).toArray())
            if (sign === 1) strapIdx.push(0, 2, 1, 2, 3, 1)
            void base
        }
        const sg = track(new THREE.BufferGeometry())
        sg.setAttribute('position', new THREE.Float32BufferAttribute(strap, 3))
        sg.setIndex(strapIdx)
        sg.computeVertexNormals()
        root.add(new THREE.Mesh(sg, strapMat))
    }

    // ---- arena ----------------------------------------------------------

    /*
      Everything past this point is built in court-local coordinates — x
      sideways, y up, z back down the court — and the group carries one
      matrix that turns the whole lot to match the court's 5.7 degree
      rotation. Boxes are easier to reason about as numbers off the
      baseline than as rotated world points.
    */
    const arena = new THREE.Group()
    arena.matrixAutoUpdate = false
    arena.matrix.makeBasis(right, up, forward.clone().negate())
    arena.matrix.setPosition(new THREE.Vector3(centreMark.x, ground, centreMark.z))
    root.add(arena)

    const aMat = {
        wall: material({ color: COLORS.wall, roughness: 0.55 }),
        cap: material({ color: COLORS.cap, roughness: 0.5 }),
        band: material({
            color: COLORS.band,
            emissive: COLORS.bandGlow,
            emissiveIntensity: 0.22,
            roughness: 0.4,
        }),
        stand: material({ color: COLORS.stand, roughness: 1 }),
        floor: material({ color: COLORS.floor, roughness: 1 }),
        post: material({ color: COLORS.post, roughness: 0.5, metalness: 0.3 }),
    }

    const box = (x0, x1, y0, y1, d0, d1, mat, castShadow) => {
        const g = track(
            new THREE.BoxGeometry(Math.abs(x1 - x0), y1 - y0, Math.abs(d1 - d0))
        )
        const mesh = new THREE.Mesh(g, mat)
        mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, -(d0 + d1) / 2)
        mesh.receiveShadow = true
        if (castShadow) mesh.castShadow = true
        arena.add(mesh)
        return mesh
    }

    {
        const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(200, 200)), aMat.floor)
        floor.rotation.x = -Math.PI / 2
        floor.position.set(0, -0.004, -ND)
        floor.receiveShadow = true
        arena.add(floor)
    }

    for (const s of [-NH, NH]) {
        const post = new THREE.Mesh(
            track(new THREE.CylinderGeometry(0.05, 0.05, COURT.NET_POST_HEIGHT, 16)),
            aMat.post
        )
        post.position.set(s, COURT.NET_POST_HEIGHT / 2, -ND)
        post.castShadow = true
        arena.add(post)
    }

    // Walls: 1 m along the sides, 1.2 m behind the baselines.
    const WT = 0.3, WS = 1.0, WE = 1.2
    box(-SX - WT, SX + WT, 0, WE, D0 - WT, D0, aMat.wall)
    box(-SX - WT, SX + WT, 0, WE, D1, D1 + WT, aMat.wall)
    box(-SX - WT, -SX, 0, WS, D0, D1, aMat.wall)
    box(SX, SX + WT, 0, WS, D0, D1, aMat.wall)

    /*
      The lit board band sits 12 mm proud of the wall face, not flush with
      it. Flush, the two coplanar surfaces z-fight and the band flickers as
      the camera moves.
    */
    box(-SX, SX, 0.25, WE - 0.15, D0, D0 + 0.012, aMat.band)
    box(-SX, SX, 0.25, WE - 0.15, D1 - 0.012, D1, aMat.band)
    box(-SX, -SX + 0.012, 0.2, WS - 0.12, D0, D1, aMat.band)
    box(SX - 0.012, SX, 0.2, WS - 0.12, D0, D1, aMat.band)

    box(-SX - WT, SX + WT, WE, WE + 0.04, D0 - WT, D0, aMat.cap)
    box(-SX - WT, SX + WT, WE, WE + 0.04, D1, D1 + WT, aMat.cap)
    box(-SX - WT, -SX, WS, WS + 0.04, D0, D1, aMat.cap)
    box(SX, SX + WT, WS, WS + 0.04, D0, D1, aMat.cap)

    // Stands: tiers stepping up and back from an aisle behind each wall.
    const ROWS = 22, DEPTH = 0.85, RISE = 0.42, AISLE = 1.6, BASE = 1.5
    for (let i = 0; i < ROWS; i++) {
        const o = AISLE + i * DEPTH
        const h = BASE + i * RISE
        box(-SX - WT - o - DEPTH, SX + WT + o + DEPTH, 0, h, D0 - WT - o - DEPTH, D0 - WT - o, aMat.stand)
        box(-SX - WT - o - DEPTH, SX + WT + o + DEPTH, 0, h, D1 + WT + o, D1 + WT + o + DEPTH, aMat.stand)
        box(-SX - WT - o - DEPTH, -SX - WT - o, 0, h, D0 - WT - o, D1 + WT + o, aMat.stand)
        box(SX + WT + o, SX + WT + o + DEPTH, 0, h, D0 - WT - o, D1 + WT + o, aMat.stand)
    }

    /*
      The house mark, on the run-off behind the baseline. Added to the arena
      group so it inherits the court's rotation, and lifted 2.5 mm clear of
      the surface so the two coplanar surfaces cannot fight for depth.
    */
    {
        const mark = buildCourtMark()
        mark.mesh.position.set(0, 0.006, MARK_SET_BACK)
        arena.add(mark.mesh)
        disposables.push({ dispose: mark.dispose })
    }

    // ---- lights ---------------------------------------------------------

    const haze = hazeMaterial()
    disposables.push(haze)

    /*
      Aimed at the middle of the court at body height, so the cones overlap
      across the whole playing area rather than each pooling under itself.
    */
    /*
      Aimed at the server's end, not the middle of the court.

      Pointing all six at the centre circle put the server 11.9 m off axis
      and therefore near the soft edge of every cone at once, which is how
      a six-lamp rig managed to be dimmer than the eight it replaced. The
      far court is the one part of the scene the depth of field is blurring
      anyway.
    */
    const centre = courtPoint(0, 9, 1.5)
    for (let i = 0; i < RIG.lamps; i++) {
        const angle = (i / RIG.lamps) * Math.PI * 2
        const at = courtPoint(
            Math.sin(angle) * RIG.radius,
            COURT.NET_DISTANCE + Math.cos(angle) * RIG.radius,
            RIG.height
        )
        const spot = new THREE.SpotLight(COLORS.spot, RIG.intensity, 0, RIG.angle, 0.9, 2)
        spot.position.copy(at)
        spot.target.position.copy(centre)

        /*
          Exactly one of the six casts a shadow, and it is the one behind
          and above the server. Six shadow maps would cost six times as much
          to produce six overlapping penumbras that cancel into mush; one
          soft shadow is all that is needed to put the figure on the ground
          rather than floating above it.
        */
        if (i === RIG.lamps / 2) {
            spot.castShadow = true
            spot.shadow.mapSize.set(2048, 2048)
            spot.shadow.camera.near = 6
            spot.shadow.camera.far = 46
            spot.shadow.bias = -0.0002
            spot.shadow.radius = 14
        }
        root.add(spot, spot.target)

        const length = at.distanceTo(centre)
        const radius = length * Math.tan(RIG.angle) * 0.7
        const cone = new THREE.Mesh(
            track(new THREE.CylinderGeometry(0.6, radius, length, 28, 1, true)),
            haze
        )
        cone.position.addVectors(at, centre).multiplyScalar(0.5)
        cone.quaternion.setFromUnitVectors(
            up,
            new THREE.Vector3().subVectors(at, centre).normalize()
        )
        root.add(cone)
    }

    root.add(new THREE.HemisphereLight(COLORS.skyFill, COLORS.groundFill, 0.6))

    const dispose = () => {
        for (const d of disposables) d.dispose?.()
        disposables.length = 0
    }

    return { group: root, dispose, lightCount: RIG.lamps + 1 }
}
