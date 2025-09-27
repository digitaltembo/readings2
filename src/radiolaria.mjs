import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

async function main() {
  const canvas = document.querySelector("#c");
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  // renderer.setClearColorHex(0xffffff, 1);
  const fov = 75;
  const aspect = 2; // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 1.4;
  const controls = new OrbitControls(camera, renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#fff");

  async function loadCenter() {
    const square = new THREE.Shape()
      .moveTo(1, 1)
      .lineTo(1, 0)
      .lineTo(0, 0)
      .lineTo(0, 1);
    const loader = new THREE.TextureLoader();

    const texture = await loader.loadAsync(
      `./assets/rad${(Math.floor(Math.random() * 12) + 1)
        .toString()
        .padStart(2, "0")}.png`
    );
    // const geometry = new THREE.ShapeGeometry(square);
    const geometry = new THREE.PlaneGeometry(
      1,
      texture.image.height / texture.image.width
    );

    const cubes = []; // just an array we can use to rotate the cubes

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(geometry, material);
  }

  function loadCylinder(text) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.canvas.width = 400;
    ctx.canvas.height = 40;

    // ctx.fillStyle = "#FFF";
    // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111";
    ctx.font = "20px serif";
    ctx.fillText(text, 0, 40);
    const texture = new THREE.CanvasTexture(ctx.canvas);
    // const loader = new THREE.TextureLoader();

    // const texture = loader.load("./assets/radiolaria1.png");
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      // opacity: 0.5,
    });
    const r = Math.random() * 0.3 + 0.5;
    const geometry = new THREE.CylinderGeometry(r, r, 0.3, 32, 1, true);
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.rotation.z = Math.random() * Math.PI;
    const v = new THREE.Vector3(
      1,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).normalize();
    mesh.lookAt(v);

    // v.crossVectors(v, new THREE.Vector3(0, 0, 1, 0));

    // const v2 = v.clone();
    // v.applyAxisAngle(new THREE.Vector3(-1, 0, 0), Math.PI / 2);
    return [mesh, new THREE.Vector3(0, 1, 0)];
  }
  // const cylinders = loadCylinder();
  scene.add(await loadCenter());
  // scene.add(cylinder);
  const cubes = [
    "To be or not to be, that is the question",
    "To be or not to be, that is the question",
    "To be or not to be, that is the question",

    // "sweet",
    // "sick",
    // "awesome",
  ].map((text) => {
    const [cyl, axis] = loadCylinder(text);
    scene.add(cyl);
    return [cyl, axis];
  });
  // const rotation = cubes.push(cylinder); // add to our list of cubes to rotate

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }

    return needResize;
  }

  function render(time) {
    time *= 0.001;

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    cubes.forEach(([cube, v], ndx) => {
      const speed = 0.02;
      const rot = -time * speed;
      cube.rotateOnAxis(v, speed);
      // console.log(v);
      // cube.rotation.x = rot / 10;
      // cube.rotation.x = x * rot;
      // cube.rotation.y = y * rot;
      // cube.rotation.z = z * rot;
    });

    renderer.render(scene, camera);
    controls.update();

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
