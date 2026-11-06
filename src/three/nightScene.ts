/**
 * FiabaMia — the 3D night.
 *
 * A real WebGL scene sitting behind the whole site: an extruded gold crescent
 * that turns slowly, a parallax star field, drifting paper pages, golden dust
 * and the occasional shooting star. Scroll moves the camera, the pointer tilts
 * it, and everything is disposed when the scene unmounts.
 *
 * `three` is imported dynamically so the first paint never waits for it.
 */
import type * as ThreeNS from 'three'

export type NightHandle = { dispose: () => void; webgl: boolean }

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

function radialTexture(T: typeof ThreeNS, stops: [number, string][], size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([at, color]) => g.addColorStop(at, color))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  return tex
}

function streakTexture(T: typeof ThreeNS) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 32
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 0)
  g.addColorStop(0, 'rgba(255,246,224,0)')
  g.addColorStop(0.72, 'rgba(255,243,214,0.65)')
  g.addColorStop(1, 'rgba(255,255,255,1)')
  ctx.fillStyle = g
  ctx.fillRect(0, 10, 256, 12)
  ctx.globalAlpha = 0.35
  ctx.filter = 'blur(5px)'
  ctx.fillRect(0, 6, 256, 20)
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  return tex
}

function pageTexture(T: typeof ThreeNS) {
  const c = document.createElement('canvas')
  c.width = 300
  c.height = 400
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 300, 400)
  ctx.strokeStyle = 'rgba(246,239,226,0.55)'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, 298, 398)
  // ruled lines, as if the story were still being written
  for (let y = 62; y < 348; y += 21) {
    const w = 46 + ((y * 37) % 168)
    ctx.fillStyle = `rgba(246,239,226,${0.18 + ((y * 13) % 40) / 220})`
    ctx.fillRect(36, y, Math.min(w, 228), 2.2)
  }
  // a little gold paragraph mark
  ctx.fillStyle = 'rgba(220,184,124,0.5)'
  ctx.fillRect(36, 36, 26, 3)
  const tex = new T.CanvasTexture(c)
  tex.colorSpace = T.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Crescent = outer circle minus a circle shifted to the left. */
function crescentShape(T: typeof ThreeNS) {
  const R1 = 1
  const R2 = 0.96
  const d = 0.32
  const x = (R2 * R2 - R1 * R1 - d * d) / (2 * d)
  const y = Math.sqrt(Math.max(0, R1 * R1 - x * x))
  const th = Math.atan2(y, x)
  const a1 = Math.atan2(y, x + d)
  const steps = 90
  const shape = new T.Shape()
  shape.moveTo(Math.cos(-th) * R1, Math.sin(-th) * R1)
  for (let i = 1; i <= steps; i++) {
    const a = -th + 2 * th * (i / steps)
    shape.lineTo(Math.cos(a) * R1, Math.sin(a) * R1)
  }
  for (let i = 1; i <= steps; i++) {
    const a = a1 - 2 * a1 * (i / steps)
    shape.lineTo(Math.cos(a) * R2 - d, Math.sin(a) * R2)
  }
  shape.closePath()
  return shape
}

export async function mountNightScene(
  canvas: HTMLCanvasElement,
  opts: { reduce?: boolean } = {},
): Promise<NightHandle> {
  const T = await import('three')
  const reduce = !!opts.reduce

  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12

  const scene = new T.Scene()
  scene.fog = new T.FogExp2(0x05070f, 0.012)

  const camera = new T.PerspectiveCamera(42, 1, 0.1, 200)
  camera.position.set(0, 0, 12)

  const disposables: { dispose: () => void }[] = []
  const track = <X extends { dispose: () => void }>(x: X) => {
    disposables.push(x)
    return x
  }

  /* ---------------- lights ---------------- */
  scene.add(new T.AmbientLight(0x33446f, 1.05))
  const key = new T.DirectionalLight(0xffe7bb, 2.6)
  key.position.set(-5, 4.5, 7)
  scene.add(key)
  const rim = new T.DirectionalLight(0x7093d8, 1.2)
  rim.position.set(6, -3, -6)
  scene.add(rim)

  /* ---------------- the moon ---------------- */
  const moonGroup = new T.Group()
  const moonGeo = track(
    new T.ExtrudeGeometry(crescentShape(T), {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.028,
      bevelSegments: 2,
      curveSegments: 96,
    }),
  )
  moonGeo.center()
  const moonMat = track(
    new T.MeshStandardMaterial({
      color: 0xf3dca8,
      roughness: 0.58,
      metalness: 0.08,
      emissive: 0x3a2a10,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 1,
    }),
  )
  const moon = new T.Mesh(moonGeo, moonMat)
  moonGroup.add(moon)

  const haloMat = track(
    new T.SpriteMaterial({
      map: track(
        radialTexture(T, [
          [0, 'rgba(255,236,196,0.34)'],
          [0.34, 'rgba(233,200,141,0.13)'],
          [0.72, 'rgba(200,160,90,0.04)'],
          [1, 'rgba(200,160,90,0)'],
        ]),
      ),
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      opacity: 0.5,
    }),
  )
  const halo = new T.Sprite(haloMat)
  halo.scale.setScalar(4.6)
  halo.position.z = -1.2
  moonGroup.add(halo)

  // three small orbiting gold stars around the moon
  const orbiters: ThreeNS.Mesh[] = []
  const starGeo = track(new T.TetrahedronGeometry(0.07, 0))
  const starMat = track(
    new T.MeshStandardMaterial({
      color: 0xffecc6,
      emissive: 0xffcf86,
      emissiveIntensity: 1.6,
      roughness: 0.4,
      transparent: true,
      opacity: 1,
    }),
  )
  for (let i = 0; i < 3; i++) {
    const star = new T.Mesh(starGeo, starMat)
    orbiters.push(star)
    moonGroup.add(star)
  }

  scene.add(moonGroup)

  /* ---------------- background glows ---------------- */
  const glowTex = track(
    radialTexture(T, [
      [0, 'rgba(120,160,235,0.20)'],
      [0.55, 'rgba(80,110,190,0.06)'],
      [1, 'rgba(80,110,190,0)'],
    ]),
  )
  const glowMat = track(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0.9 }))
  const glowA = new T.Sprite(glowMat)
  glowA.scale.setScalar(46)
  glowA.position.set(-14, -6, -46)
  scene.add(glowA)
  const glowB = new T.Sprite(glowMat)
  glowB.scale.setScalar(30)
  glowB.position.set(18, 12, -40)
  scene.add(glowB)

  /* ---------------- star field ---------------- */
  const starCount = reduce ? 900 : window.innerWidth < 760 ? 1500 : 2600
  const sPos = new Float32Array(starCount * 3)
  const sSize = new Float32Array(starCount)
  const sPhase = new Float32Array(starCount)
  for (let i = 0; i < starCount; i++) {
    sPos[i * 3] = (Math.random() - 0.5) * 78
    sPos[i * 3 + 1] = (Math.random() - 0.5) * 46
    sPos[i * 3 + 2] = 6 - Math.random() * 66
    sSize[i] = 0.4 + Math.random() * 1.9
    sPhase[i] = Math.random() * Math.PI * 2
  }
  const starFieldGeo = track(new T.BufferGeometry())
  starFieldGeo.setAttribute('position', new T.BufferAttribute(sPos, 3))
  starFieldGeo.setAttribute('aSize', new T.BufferAttribute(sSize, 1))
  starFieldGeo.setAttribute('aPhase', new T.BufferAttribute(sPhase, 1))

  const starUniforms = { uTime: { value: 0 } }
  const starFieldMat = track(
    new T.ShaderMaterial({
      uniforms: starUniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          vAlpha = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * 1.3 + aPhase));
          gl_PointSize = aSize * (30.0 / max(1.0, -mv.z));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          float a = 1.0 - smoothstep(0.03, 0.5, d);
          vec3 col = mix(vec3(0.80, 0.87, 1.0), vec3(1.0, 0.90, 0.68), 0.35);
          gl_FragColor = vec4(col, a * vAlpha);
        }
      `,
    }),
  )
  const starField = new T.Points(starFieldGeo, starFieldMat)
  scene.add(starField)

  /* ---------------- golden dust ---------------- */
  const dustCount = reduce ? 90 : 240
  const dPos = new Float32Array(dustCount * 3)
  const dSize = new Float32Array(dustCount)
  const dSpeed = new Float32Array(dustCount)
  const dPhase = new Float32Array(dustCount)
  for (let i = 0; i < dustCount; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 34
    dPos[i * 3 + 1] = (Math.random() - 0.5) * 24
    dPos[i * 3 + 2] = 4 - Math.random() * 18
    dSize[i] = 0.7 + Math.random() * 2.2
    dSpeed[i] = 0.12 + Math.random() * 0.4
    dPhase[i] = Math.random() * Math.PI * 2
  }
  const dustGeo = track(new T.BufferGeometry())
  dustGeo.setAttribute('position', new T.BufferAttribute(dPos, 3))
  dustGeo.setAttribute('aSize', new T.BufferAttribute(dSize, 1))
  dustGeo.setAttribute('aSpeed', new T.BufferAttribute(dSpeed, 1))
  dustGeo.setAttribute('aPhase', new T.BufferAttribute(dPhase, 1))
  const dustUniforms = { uTime: { value: 0 } }
  const dustMat = track(
    new T.ShaderMaterial({
      uniforms: dustUniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aSpeed;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.y = mod(p.y + uTime * aSpeed + 14.0, 28.0) - 14.0;
          p.x += sin(uTime * 0.4 + aPhase) * 0.6;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float fade = 1.0 - smoothstep(4.0, 14.0, abs(p.y));
          vAlpha = (0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 1.8 + aPhase))) * fade;
          gl_PointSize = aSize * (26.0 / max(1.0, -mv.z));
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          float a = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(1.0, 0.86, 0.58, a * vAlpha);
        }
      `,
    }),
  )
  const dust = new T.Points(dustGeo, dustMat)
  scene.add(dust)

  /* ---------------- drifting pages ---------------- */
  const pgTex = track(pageTexture(T))
  const pgMat = track(
    new T.MeshBasicMaterial({
      map: pgTex,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: T.DoubleSide,
      fog: true,
    }),
  )
  const pages: { mesh: ThreeNS.Mesh; speed: number; sway: number; phase: number; spin: number }[] = []
  for (let i = 0; i < 6; i++) {
    const geo = track(new T.PlaneGeometry(1.5, 2, 6, 8))
    const pos = geo.attributes.position as ThreeNS.BufferAttribute
    for (let v = 0; v < pos.count; v++) {
      const px = pos.getX(v)
      const py = pos.getY(v)
      pos.setZ(v, Math.sin(px * 2.4) * 0.09 + Math.cos(py * 1.5) * 0.05)
    }
    geo.computeVertexNormals()
    const mesh = new T.Mesh(geo, pgMat)
    mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 18, -2 - Math.random() * 12)
    mesh.rotation.set(Math.random() * 0.5 - 0.25, Math.random() * Math.PI, Math.random() * 0.6 - 0.3)
    scene.add(mesh)
    pages.push({ mesh, speed: 0.16 + Math.random() * 0.3, sway: 0.4 + Math.random() * 0.6, phase: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.1 })
  }

  /* ---------------- shooting star ---------------- */
  const shooterMat = track(
    new T.SpriteMaterial({
      map: track(streakTexture(T)),
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      opacity: 0,
    }),
  )
  const shooter = new T.Sprite(shooterMat)
  shooter.scale.set(9, 0.34, 1)
  shooter.position.set(0, 0, -8)
  scene.add(shooter)

  type Shot = { t: number; from: ThreeNS.Vector3; to: ThreeNS.Vector3; dur: number; wait: number }
  let shot: Shot = { t: 0, from: new T.Vector3(), to: new T.Vector3(), dur: 1, wait: 2.5 }

  const respawnShot = () => {
    const y = 4 + Math.random() * 6
    const x = -16 + Math.random() * 8
    shot.from.set(x, y, -6 - Math.random() * 8)
    shot.to.set(x + 16 + Math.random() * 10, y - 7 - Math.random() * 4, shot.from.z - 2)
    shot.dur = 0.9 + Math.random() * 0.5
    shot.wait = 3 + Math.random() * 9
    shot.t = 0
  }
  respawnShot()
  shot.t = -shot.wait

  /* ---------------- camera + scroll ---------------- */
  let scrollVh = 0
  let baseZ = 12
  let moonBase = new T.Vector2(4.6, 2.5)
  const pointer = new T.Vector2(0, 0)
  const smooth = new T.Vector2(0, 0)

  const onScroll = () => {
    scrollVh = window.scrollY / Math.max(1, window.innerHeight)
  }
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  const onLeave = () => {
    pointer.x = 0
    pointer.y = 0
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerleave', onLeave)

  const resize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    const aspect = w / h
    camera.aspect = aspect
    camera.updateProjectionMatrix()
    const wide = aspect > 1.05
    baseZ = wide ? 12 : 15
    camera.position.z = baseZ
    moonBase = wide ? new T.Vector2(4.5, 2.5) : new T.Vector2(1.5, 3.2)
    moonGroup.scale.setScalar(wide ? 1.5 : 1.05)
  }
  resize()
  window.addEventListener('resize', resize)

  const placeMoon = () => {
    moonGroup.position.set(moonBase.x, moonBase.y, -1)
    moonGroup.rotation.set(0, -0.15, -0.16)
    orbiters.forEach((star, i) => {
      const a = i * 2.1
      star.position.set(Math.cos(a) * 1.35, Math.sin(a * 1.1) * 1.2, 0.2)
    })
  }
  placeMoon()
  const onResizeStationary = () => placeMoon()
  window.addEventListener('resize', onResizeStationary)
  disposables.push({ dispose: () => window.removeEventListener('resize', onResizeStationary) })

  /* ---------------- loop ---------------- */
  const clock = new T.Clock()
  let raf = 0
  let disposed = false
  let elapsed = 0

  const frame = () => {
    if (disposed) return
    raf = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    if (document.hidden) return
    elapsed += dt

    const view = clamp(scrollVh, 0, 5)

    // moon: slow turn, gentle bob, fades away once you leave the hero
    moonGroup.rotation.y = Math.sin(elapsed * 0.22) * 0.42 - 0.15 + view * 0.12
    moonGroup.rotation.z = -0.16 + Math.sin(elapsed * 0.32) * 0.04
    moonGroup.rotation.x = Math.sin(elapsed * 0.18) * 0.05
    const moonFade = clamp(1 - (view - 0.55) / 1.1)
    moonGroup.visible = moonFade > 0.01
    moonMat.opacity = moonFade
    haloMat.opacity = 0.5 * moonFade
    moonGroup.position.x = moonBase.x + Math.sin(elapsed * 0.3) * 0.12
    moonGroup.position.y = moonBase.y + Math.sin(elapsed * 0.42) * 0.1 + view * 0.55
    moonGroup.position.z = -1

    orbiters.forEach((star, i) => {
      const a = elapsed * (0.5 + i * 0.17) + i * 2.1
      star.position.set(Math.cos(a) * (1.35 + i * 0.16), Math.sin(a * 1.1) * 1.2, Math.sin(a) * 0.5 + 0.2)
      star.rotation.set(a, a * 0.7, 0)
      ;(star.material as ThreeNS.MeshStandardMaterial).opacity = moonFade
    })

    // stars parallax with the pointer, and a slow drift
    smooth.x += (pointer.x * 0.55 - smooth.x) * 0.045
    smooth.y += (pointer.y * 0.35 - smooth.y) * 0.045
    camera.position.x = smooth.x
    camera.position.y = -smooth.y - view * 0.28
    camera.position.z = baseZ - Math.min(view, 4) * 0.45
    camera.lookAt(0, 0.3 - view * 0.1, 0)

    starField.rotation.z = elapsed * 0.004
    starField.rotation.y = Math.sin(elapsed * 0.05) * 0.04
    starUniforms.uTime.value = elapsed
    dustUniforms.uTime.value = elapsed
    glowA.material.opacity = 0.6 + Math.sin(elapsed * 0.5) * 0.08

    // pages drift upward and sway
    pages.forEach((p) => {
      p.mesh.position.y += p.speed * dt
      p.mesh.position.x += Math.sin(elapsed * 0.45 + p.phase) * p.sway * dt
      p.mesh.rotation.z += p.spin * dt
      p.mesh.rotation.y += Math.sin(elapsed * 0.3 + p.phase) * 0.05 * dt
      if (p.mesh.position.y > 11) {
        p.mesh.position.y = -11
        p.mesh.position.x = (Math.random() - 0.5) * 22
        p.mesh.position.z = -2 - Math.random() * 12
      }
    })

    // the occasional shooting star
    shot.t += dt
    if (shot.t < 0) {
      shooterMat.opacity = 0
    } else if (shot.t < shot.dur) {
      const k = shot.t / shot.dur
      shooter.position.lerpVectors(shot.from, shot.to, k)
      shooterMat.opacity = Math.sin(k * Math.PI) * 0.95
      shooterMat.rotation = Math.atan2(shot.to.y - shot.from.y, shot.to.x - shot.from.x)
    } else {
      shooterMat.opacity = 0
      if (shot.t > shot.dur + shot.wait) respawnShot()
    }

    renderer.render(scene, camera)
  }

  // first frame, synchronously, so there is never an empty canvas
  moonGroup.updateMatrixWorld()
  renderer.render(scene, camera)

  if (reduce) {
    // one still frame is enough; redraw on resize
    const redraw = () => renderer.render(scene, camera)
    window.addEventListener('resize', redraw)
    disposables.push({ dispose: () => window.removeEventListener('resize', redraw) })
  } else {
    raf = requestAnimationFrame(frame)
  }

  return {
    webgl: true,
    dispose() {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', resize)
      disposables.forEach((d) => {
        try {
          d.dispose()
        } catch {
          /* already gone */
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
