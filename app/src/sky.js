import * as THREE from 'three';

/**
 * Night-sky scene: a drifting starfield with a golden moon.
 * Subtle parallax tied to pointer + scroll, so the background breathes
 * without ever fighting the text.
 */
export function createSky(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 240);
  camera.position.set(0, 0, 22);

  /* -------------------------------------------------- starfield */
  const STAR_COUNT = window.innerWidth < 700 ? 1400 : 3000;
  const positions = new Float32Array(STAR_COUNT * 3);
  const sizes = new Float32Array(STAR_COUNT);
  const phases = new Float32Array(STAR_COUNT);
  const tints = new Float32Array(STAR_COUNT * 3);

  const gold = new THREE.Color('#e8c47a');
  const warm = new THREE.Color('#fff6e2');
  const cool = new THREE.Color('#c9d8ff');

  for (let i = 0; i < STAR_COUNT; i += 1) {
    // spread through a wide, deep box so parallax reads as depth
    positions[i * 3] = (Math.random() - 0.5) * 150;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 110;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 120 - 10;

    sizes[i] = 0.12 + Math.pow(Math.random(), 3) * 1.5;
    phases[i] = Math.random() * Math.PI * 2;

    const roll = Math.random();
    const c = roll > 0.85 ? gold : roll > 0.55 ? warm : cool;
    tints[i * 3] = c.r;
    tints[i * 3 + 1] = c.g;
    tints[i * 3 + 2] = c.b;
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  starGeo.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));

  const starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 aTint;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vTwinkle;
      varying vec3 vTint;

      void main() {
        vec3 p = position;
        // slow drift so the whole sky is alive
        p.x += sin(uTime * 0.08 + aPhase) * 1.4;
        p.y += cos(uTime * 0.06 + aPhase * 1.3) * 1.1;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aPhase * 2.2);
        vTint = aTint;

        float dist = -mv.z;
        gl_PointSize = aSize * uPixelRatio * (58.0 / max(dist, 1.0)) * (0.75 + vTwinkle * 0.5);
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTwinkle;
      varying vec3 vTint;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        // soft core with a faint halo
        float core = smoothstep(0.5, 0.0, d);
        float halo = smoothstep(0.5, 0.12, d);
        float a = (core * 0.85 + halo * 0.35) * vTwinkle;
        gl_FragColor = vec4(vTint, a);
      }
    `,
  });

  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* -------------------------------------------------- moon */
  const moonGroup = new THREE.Group();
  moonGroup.position.set(9, 8.5, -34);
  scene.add(moonGroup);

  const moonGeo = new THREE.SphereGeometry(5.2, 64, 64);
  const moonMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec2 vUv;

      // cheap value noise for lunar mottling
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        vec3 lightDir = normalize(vec3(-0.55, 0.5, 0.7));
        float diff = clamp(dot(vNormal, lightDir), 0.0, 1.0);
        float rim = pow(1.0 - clamp(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 2.2);

        float m = noise(vUv * 7.0) * 0.55 + noise(vUv * 19.0) * 0.3 + noise(vUv * 41.0) * 0.15;
        float mottling = mix(0.82, 1.0, m);

        vec3 cream = vec3(1.0, 0.968, 0.886);
        vec3 amber = vec3(0.909, 0.768, 0.478);
        vec3 col = mix(amber, cream, smoothstep(0.15, 0.95, diff)) * mottling;

        col += vec3(1.0, 0.87, 0.6) * rim * 0.55;
        col *= 0.72 + diff * 0.5;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const moon = new THREE.Mesh(moonGeo, moonMat);
  moonGroup.add(moon);

  // halo behind the moon
  const haloGeo = new THREE.PlaneGeometry(34, 34);
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float g = smoothstep(1.0, 0.18, d);
        float pulse = 0.86 + 0.14 * sin(uTime * 0.55);
        gl_FragColor = vec4(vec3(0.909, 0.768, 0.478), g * 0.2 * pulse);
      }
    `,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.z = -1.5;
  moonGroup.add(halo);

  /* -------------------------------------------------- dust motes */
  const DUST = 260;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i += 1) {
    dustPos[i * 3] = (Math.random() - 0.5) * 70;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 46;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 30 + 4;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustMat = new THREE.PointsMaterial({
    size: 0.16,
    color: 0xe8c47a,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  /* -------------------------------------------------- interaction */
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let scrollNorm = 0;
  let scrollSmooth = 0;
  let running = true;
  let raf = 0;

  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollNorm = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);

    const t = clock.getElapsedTime();

    smooth.x += (pointer.x - smooth.x) * 0.04;
    smooth.y += (pointer.y - smooth.y) * 0.04;
    scrollSmooth += (scrollNorm - scrollSmooth) * 0.06;

    starMat.uniforms.uTime.value = t;
    moonMat.uniforms.uTime.value = t;
    haloMat.uniforms.uTime.value = t;

    // gentle orbit + parallax
    stars.rotation.y = smooth.x * 0.06 + t * 0.004;
    stars.rotation.x = -smooth.y * 0.04;
    stars.position.y = scrollSmooth * 7;

    moonGroup.position.x = 9 + smooth.x * 1.6;
    moonGroup.position.y = 8.5 - smooth.y * 1.2 + scrollSmooth * 5;
    moon.rotation.y = t * 0.03 + smooth.x * 0.15;

    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.5 + scrollSmooth * 3;
    dust.position.x = smooth.x * 0.6;

    camera.position.x = smooth.x * 1.1;
    camera.position.y = -smooth.y * 0.8;

    renderer.render(scene, camera);
  }

  frame();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      clock.getDelta();
      frame();
    }
  });

  onScroll();
  onResize();
  window.addEventListener('scroll', onScroll, { passive: true });
}
