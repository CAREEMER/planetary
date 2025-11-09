// src/render/renderer.js
import * as THREE from 'three';
import {setupControls} from './controls.js';
import {createPixelTarget, renderPixelated} from './pixelate.js';

function valueNoiseGLSL() {
    return `
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1,311.7, 74.7))) * 43758.5453123);
  }
  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f*f*(3.0-2.0*f);
    float n000 = hash(i + vec3(0,0,0));
    float n100 = hash(i + vec3(1,0,0));
    float n010 = hash(i + vec3(0,1,0));
    float n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1));
    float n101 = hash(i + vec3(1,0,1));
    float n011 = hash(i + vec3(0,1,1));
    float n111 = hash(i + vec3(1,1,1));
    float nx00 = mix(n000, n100, u.x);
    float nx10 = mix(n010, n110, u.x);
    float nx01 = mix(n001, n101, u.x);
    float nx11 = mix(n011, n111, u.x);
    float nxy0 = mix(nx00, nx10, u.y);
    float nxy1 = mix(nx01, nx11, u.y);
    return mix(nxy0, nxy1, u.z) * 2.0 - 1.0;
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * valueNoise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }`;
}

function planetMaterial() {
    const fragment = `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;

  uniform float uBiomeScale;
  uniform float uDetailScale;
  uniform vec3 uPalette[6];
  uniform float uTime;

  ${valueNoiseGLSL()}

  void main() {
    vec3 N = normalize(vNormal);
    vec3 P = vPos;

    float lat = abs(normalize(P).y);
    float continents = valueNoise(P / uBiomeScale);
    float detail = fbm(P * uDetailScale);

    float biomeMix = smoothstep(-0.2, 0.2, continents) * (1.0 - lat);
    int idx = clamp(int(floor(biomeMix * 15.0)), 0, 15);
        
    vec3 base = uPalette[idx];

    // Simple lambert lighting with one light direction for readability
    vec3 L = normalize(vec3(0.6, 0.7, 0.5));
    float ndl = clamp(dot(N, L) * 0.7 + 0.3, 0.0, 1.0);

    vec3 color = base * ndl + 0.1 * detail;
    gl_FragColor = vec4(color, 1.0);
  }`;

    const vertex = `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normalMatrix * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

    return new THREE.ShaderMaterial({
        uniforms: {
            uBiomeScale: {value: 1.0},
            uDetailScale: {value: 4.0},
            uPalette: {
                value: [
                    new THREE.Color('#6a5acd').toArray(), // indigo
                    new THREE.Color('#3a5f0b').toArray(),
                    new THREE.Color('#567d46').toArray(),
                    new THREE.Color('#7fb069').toArray(),
                    new THREE.Color('#a4c2a5').toArray(),
                    new THREE.Color('#d1e8cf').toArray(),
                    new THREE.Color('#f2f2f2').toArray(),
                    new THREE.Color('#2f4f4f').toArray(), // deep teal
                    new THREE.Color('#1e90ff').toArray(), // ocean blue
                    new THREE.Color('#8b4513').toArray(), // brown (rock)
                    new THREE.Color('#c2b280').toArray(), // sand
                    new THREE.Color('#556b2f').toArray(), // olive
                    new THREE.Color('#9acd32').toArray(), // lime green
                    new THREE.Color('#708090').toArray(), // slate
                    new THREE.Color('#ff7f50').toArray(), // coral
                    new THREE.Color('#98fb98').toArray(), // pale green
                ].map(v => new THREE.Vector3().fromArray(v))
            },
            uTime: {value: 0.0},
        },
        vertexShader: vertex,
        fragmentShader: fragment,
    });
}

export function mountRenderer(canvas) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
    });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 3);

    const controls = setupControls(camera, canvas);

    const planetGeo = new THREE.SphereGeometry(1, 128, 64);
    const planetMat = planetMaterial();
    const planet = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planet);

    const moonGroup = new THREE.Group();
    scene.add(moonGroup);

    let moonMesh = null;
    let moonOrbitRadius = 2.5;
    let moonOrbitSpeed = 0.02;
    let moonInclination = 0;

    const pixel = createPixelTarget(renderer, 0.33);

    function onResize() {
        const w = canvas.clientWidth | 0;
        const h = canvas.clientHeight | 0;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        pixel.rt.dispose();
        const p = createPixelTarget(renderer, 0.33);
        pixel.rt = p.rt;
        pixel.quadScene = p.quadScene;
        pixel.quadCamera = p.quadCamera;
    }

    window.addEventListener('resize', onResize, {passive: true});

    // Double-click/click-and-release twice to reset framing
    let lastTap = 0;

    function dblReset() {
        controls.reset();
    }

    canvas.addEventListener('dblclick', dblReset);
    canvas.addEventListener('touchend', (e) => {
        const now = performance.now();
        if (now - lastTap < 300) dblReset();
        lastTap = now;
    }, {passive: true});

    function setPaletteIndex(idx) {
        // optional: choose pre-baked palettes by index
    }

    function regenerate({planet: p, moon: m}) {
        planet.scale.setScalar(p.radius);
        planet.rotation.set(0, 0, 0);
        planet.rotation.x = THREE.MathUtils.degToRad(p.tiltDeg);
        planet.userData.rotationSpeed = p.rotationSpeed;
        planetMat.uniforms.uBiomeScale.value = p.biomeNoiseScale;
        planetMat.uniforms.uDetailScale.value = p.detailNoiseScale;
        setPaletteIndex(p.paletteIndex);

        if (moonMesh) {
            moonGroup.remove(moonMesh);
            moonMesh.geometry.dispose();
            moonMesh.material.dispose();
            moonMesh = null;
        }
        if (m) {
            const geo = new THREE.SphereGeometry(p.radius * m.radiusRatio, 64, 32);
            const mat = planetMat.clone();
            moonMesh = new THREE.Mesh(geo, mat);
            moonGroup.add(moonMesh);
            moonOrbitRadius = m.orbitRadius;
            moonOrbitSpeed = m.orbitSpeed;
            moonInclination = THREE.MathUtils.degToRad(m.inclinationDeg);
        }
    }

    let t = 0;

    function tick() {
        requestAnimationFrame(tick);
        t += 1 / 60;
        planet.rotation.y += planet.userData.rotationSpeed ?? 0.003;
        if (moonMesh) {
            const x = Math.cos(t * moonOrbitSpeed) * moonOrbitRadius;
            const z = Math.sin(t * moonOrbitSpeed) * moonOrbitRadius;
            const y = Math.sin(moonInclination) * z;
            moonMesh.position.set(x, y, Math.cos(moonInclination) * z);
        }
        controls.update();
        planetMat.uniforms.uTime.value = t;
        renderPixelated(renderer, scene, camera, pixel);
    }

    tick();

    return {
        regenerate,
        dispose() {
            window.removeEventListener('resize', onResize);
            canvas.removeEventListener('dblclick', dblReset);
            renderer.dispose();
            planetGeo.dispose();
            planetMat.dispose();
            pixel.rt.dispose();
        }
    };
}
