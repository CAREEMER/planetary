import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 1.2;
  controls.maxDistance = 6.0;
  controls.target.set(0, 0, 0);
  return controls;
}