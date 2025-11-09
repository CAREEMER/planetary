import * as THREE from 'three';

export function createPixelTarget(renderer, scale = 0.33) {
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const w = Math.max(1, Math.floor(size.x * scale));
  const h = Math.max(1, Math.floor(size.y * scale));

  const rt = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: true,
    stencilBuffer: false,
  });

  const quadScene = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadMat = new THREE.MeshBasicMaterial({ map: rt.texture });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
  quadScene.add(quad);

  return { rt, quadScene, quadCamera };
}

export function renderPixelated(renderer, scene, camera, pixel) {
  renderer.setRenderTarget(pixel.rt);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(pixel.quadScene, pixel.quadCamera);
}
