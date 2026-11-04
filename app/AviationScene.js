"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const FLIGHT_DURATION_S = 26;
/** Starts part-way along the route so the aircraft is on screen as soon as the page opens. */
const START_CYCLE = 0.45;
const CAMERA_DISTANCE = 18;
const VIEW_HALF_HEIGHT = CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(16));
const AIRCRAFT_ROLL = 0.42;
const POINTER_REACH = 0.7;
const SCROLL_REACH = 0.0016;
const FUSELAGE_TAIL = -3.4;
const FUSELAGE_TAIL_START = -1.2;
const FUSELAGE_NOSE_START = 1.7;
const FUSELAGE_NOSE = 3.2;
const FUSELAGE_RADIUS = 0.48;
const WING_DIHEDRAL = 0.08;
const ENGINE_SPAN = 1.45;
const SCROLL_FLIGHT_SECONDS = 0.006;
const BANK_PER_PIXEL = 0.004;
const MAX_BANK = 0.35;
const BANK_RECOVERY = 0.94;
const HEADER_SCENE_MIN_WIDTH = 960;
const HEADER_AIRCRAFT_SCALE = 0.42;
const HEADER_TURN_SPEED = 0.18;

function getQuality() {
  const isLowPower = window.innerWidth < 768 || (navigator.hardwareConcurrency || 8) <= 4;
  return isLowPower
    ? { pixelRatio: 1.25, fuselageSegments: 24, engineSegments: 16, liveryWidth: 512 }
    : { pixelRatio: 1.75, fuselageSegments: 48, engineSegments: 28, liveryWidth: 1024 };
}

function createPlanform(points, depth) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) => (index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

function addMirrored(group, geometry, material, position) {
  [1, -1].forEach((side) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z * side);
    mesh.scale.z = side;
    group.add(mesh);
  });
}

function fuselageRadius(x) {
  if (x > FUSELAGE_NOSE_START) {
    const along = (x - FUSELAGE_NOSE_START) / (FUSELAGE_NOSE - FUSELAGE_NOSE_START);
    return FUSELAGE_RADIUS * Math.sqrt(Math.max(1 - along ** 2.2, 0));
  }
  if (x < FUSELAGE_TAIL_START) {
    const along = (FUSELAGE_TAIL_START - x) / (FUSELAGE_TAIL_START - FUSELAGE_TAIL);
    return FUSELAGE_RADIUS * (1 - along ** 1.6);
  }
  return FUSELAGE_RADIUS;
}

function createFuselageGeometry(segments) {
  const stations = 80;
  const profile = Array.from({ length: stations + 1 }, (_, index) => {
    const x = FUSELAGE_TAIL + ((FUSELAGE_NOSE - FUSELAGE_TAIL) * index) / stations;
    return new THREE.Vector2(Math.max(fuselageRadius(x), 0.001), x);
  });
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.rotateZ(-Math.PI / 2);

  // Sweeps the tail up and drops the nose slightly, the way a real airliner is shaped.
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const tailLift = x < -1 ? 0.055 * (x + 1) ** 2 : 0;
    const noseDrop = x > 2.1 ? 0.05 * (x - 2.1) ** 2 : 0;
    positions.setY(index, positions.getY(index) + tailLift - noseDrop);
  }
  return geometry;
}

/** Paints the fuselage. Across the canvas is around the body (top at 0.75, belly at 0.25). Down the canvas runs nose to tail. */
function createLiveryTexture(width, anisotropy) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = width * 2;
  const context = canvas.getContext("2d");
  const aroundToPx = (around) => around * canvas.width;
  const alongToPx = (x) => (1 - (x - FUSELAGE_TAIL) / (FUSELAGE_NOSE - FUSELAGE_TAIL)) * canvas.height;
  const band = (from, to, color) => {
    context.fillStyle = color;
    context.fillRect(aroundToPx(from), 0, aroundToPx(to - from), canvas.height);
  };

  context.fillStyle = "#f6f8fb";
  context.fillRect(0, 0, canvas.width, canvas.height);
  band(0.09, 0.41, "#c6cdd8");
  band(0.05, 0.08, "#14306e");
  band(0.42, 0.45, "#14306e");
  band(0.08, 0.09, "#f2b84b");
  band(0.41, 0.42, "#f2b84b");

  const windowRows = [0.965, 0.535];
  context.fillStyle = "#16233f";
  windowRows.forEach((around) => {
    for (let x = -1.75; x < 1.75; x += 0.13) {
      context.beginPath();
      context.ellipse(aroundToPx(around), alongToPx(x), width * 0.014, width * 0.009, 0, 0, Math.PI * 2);
      context.fill();
    }
  });

  context.strokeStyle = "#8d97a8";
  context.lineWidth = Math.max(width / 512, 1);
  windowRows.forEach((around) => {
    [1.98, -1.95].forEach((x) => {
      context.strokeRect(aroundToPx(around - 0.05), alongToPx(x + 0.07), aroundToPx(0.085), alongToPx(x - 0.07) - alongToPx(x + 0.07));
    });
  });

  context.fillStyle = "#101b33";
  context.fillRect(aroundToPx(0.63), alongToPx(2.66), aroundToPx(0.24), alongToPx(2.44) - alongToPx(2.66));
  context.fillStyle = "#f6f8fb";
  for (let around = 0.63; around <= 0.87; around += 0.06) {
    context.fillRect(aroundToPx(around) - width * 0.003, alongToPx(2.66), width * 0.006, alongToPx(2.44) - alongToPx(2.66));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

/** A sunset gradient for the metal to reflect, so the aircraft catches warm light against the blue sky. */
function createSkyReflection(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#4a70ad");
  sky.addColorStop(0.44, "#f6d3a4");
  sky.addColorStop(0.52, "#f09050");
  sky.addColorStop(0.62, "#3b4866");
  sky.addColorStop(1, "#161e33");
  context.fillStyle = sky;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  const generator = new THREE.PMREMGenerator(renderer);
  const reflection = generator.fromEquirectangular(texture).texture;
  texture.dispose();
  generator.dispose();
  return reflection;
}

function addEngines(aircraft, segments) {
  const position = (x, y) => new THREE.Vector3(x, y, ENGINE_SPAN);
  const cowlMaterial = new THREE.MeshStandardMaterial({ color: 0xe4e8ee, metalness: 0.55, roughness: 0.3, side: THREE.DoubleSide });
  const fanMaterial = new THREE.MeshStandardMaterial({ color: 0x20252f, metalness: 0.8, roughness: 0.45 });
  const spinnerMaterial = new THREE.MeshStandardMaterial({ color: 0xc9ced8, metalness: 0.9, roughness: 0.25 });

  const cowlProfile = [[0.14, -0.62], [0.2, -0.5], [0.27, -0.2], [0.29, 0.08], [0.28, 0.32], [0.25, 0.45], [0.21, 0.47], [0.2, 0.42]]
    .map(([radius, along]) => new THREE.Vector2(radius, along));
  const cowl = new THREE.LatheGeometry(cowlProfile, segments);
  cowl.rotateZ(-Math.PI / 2);
  addMirrored(aircraft, cowl, cowlMaterial, position(0.15, -0.5));

  const fan = new THREE.CircleGeometry(0.205, segments);
  fan.rotateY(Math.PI / 2);
  addMirrored(aircraft, fan, fanMaterial, position(0.5, -0.5));

  const spinner = new THREE.ConeGeometry(0.06, 0.14, 16);
  spinner.rotateZ(-Math.PI / 2);
  addMirrored(aircraft, spinner, spinnerMaterial, position(0.56, -0.5));

  const pylon = new THREE.BoxGeometry(0.62, 0.26, 0.05);
  addMirrored(aircraft, pylon, cowlMaterial, position(-0.08, -0.22));
}

function createAircraft(quality, anisotropy) {
  const aircraft = new THREE.Group();
  const liveryMaterial = new THREE.MeshStandardMaterial({
    map: createLiveryTexture(quality.liveryWidth, anisotropy),
    metalness: 0.2,
    roughness: 0.34,
    side: THREE.DoubleSide,
  });
  const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xd9dee6, metalness: 0.45, roughness: 0.38, side: THREE.DoubleSide });
  const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x14306e, metalness: 0.25, roughness: 0.36, side: THREE.DoubleSide });

  aircraft.add(new THREE.Mesh(createFuselageGeometry(quality.fuselageSegments), liveryMaterial));

  const wingGeometry = createPlanform([[0.9, 0], [-0.55, 0], [-1.85, 3.9], [-1.4, 3.9]], 0.06);
  wingGeometry.rotateX(Math.PI / 2);
  wingGeometry.rotateX(-WING_DIHEDRAL);
  addMirrored(aircraft, wingGeometry, wingMaterial, new THREE.Vector3(0, -0.2, 0.3));

  const wingletGeometry = createPlanform([[-1.4, 0], [-1.85, 0], [-2.2, 0.55], [-2, 0.55]], 0.03);
  addMirrored(aircraft, wingletGeometry, tailMaterial, new THREE.Vector3(0, -0.2 + 3.9 * Math.sin(WING_DIHEDRAL), 4.2));

  const stabilizerGeometry = createPlanform([[-2.45, 0], [-3.1, 0], [-3.6, 1.35], [-3.32, 1.35]], 0.04);
  stabilizerGeometry.rotateX(Math.PI / 2);
  addMirrored(aircraft, stabilizerGeometry, wingMaterial, new THREE.Vector3(0, 0.16, 0.05));

  const finGeometry = createPlanform([[-2.05, 0.3], [-3.2, 0.2], [-3.75, 1.8], [-3.25, 1.8]], 0.05);
  const fin = new THREE.Mesh(finGeometry, tailMaterial);
  fin.position.z = -0.025;
  aircraft.add(fin);

  addEngines(aircraft, quality.engineSegments);

  aircraft.rotation.order = "YZX";
  aircraft.scale.setScalar(0.62);
  return aircraft;
}

function createFlightCurve(halfWidth) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.35 * halfWidth, -3.9, -2),
    new THREE.Vector3(-0.35 * halfWidth, -3.1, -1),
    new THREE.Vector3(0.28 * halfWidth, 0.5, 0),
    new THREE.Vector3(0.68 * halfWidth, 2.4, 1),
    new THREE.Vector3(1.4 * halfWidth, 5, -2),
  ]);
}

function disposeScene(scene) {
  scene.traverse((object) => {
    object.geometry?.dispose();
    object.material?.map?.dispose();
    object.material?.dispose();
  });
}

/** "flight" crosses the home hero along a route. "header" is a small aircraft turning slowly beside a page title. */
export default function AviationScene({ mode = "flight" }) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const root = sceneRef.current;
    if (!root) return undefined;
    const isHeader = mode === "header";
    // Page titles fill the width on small screens, so the header aircraft would only sit behind the text.
    if (isHeader && window.innerWidth < HEADER_SCENE_MIN_WIDTH) return undefined;
    const keepCameraStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isStillFrame = isHeader && keepCameraStill;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn("Three.js hero scene could not initialize WebGL.", error);
      return undefined;
    }

    const quality = getQuality();
    const scene = new THREE.Scene();
    const aspect = root.clientWidth / Math.max(root.clientHeight, 1);
    const halfWidth = VIEW_HALF_HEIGHT * aspect;
    const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 60);
    camera.position.z = CAMERA_DISTANCE;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality.pixelRatio));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    root.appendChild(renderer.domElement);
    root.dataset.live = "true";

    const skyReflection = createSkyReflection(renderer);
    scene.environment = skyReflection;
    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x1b3a7a, 0.9));
    const sunLight = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sunLight.position.set(4, 7, 8);
    scene.add(sunLight);

    const aircraft = createAircraft(quality, renderer.capabilities.getMaxAnisotropy());
    scene.add(aircraft);

    const curve = createFlightCurve(halfWidth);
    if (isHeader) {
      aircraft.scale.setScalar(HEADER_AIRCRAFT_SCALE);
      aircraft.position.set(halfWidth * 0.62, 0, 0);
    } else {
      const path = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
        new THREE.LineDashedMaterial({ color: 0xc3d7ff, dashSize: 0.14, gapSize: 0.18, transparent: true, opacity: 0.32 }),
      );
      path.computeLineDistances();
      scene.add(path);
    }

    const pointer = { x: 0, y: 0 };
    let scrollOffset = window.scrollY;
    let elapsed = START_CYCLE * FLIGHT_DURATION_S;
    let bank = 0;
    let lastTime = 0;
    let frameId = 0;
    let isInView = false;

    const placeOnRoute = () => {
      // Scrolling back can take the time below zero, and the route only accepts 0 to 1.
      const cycle = ((elapsed / FLIGHT_DURATION_S) % 1 + 1) % 1;
      const progress = cycle + Math.sin(cycle * Math.PI * 2) * 0.045;
      const tangent = curve.getTangentAt(progress);
      aircraft.position.copy(curve.getPointAt(progress));
      aircraft.rotation.set(
        AIRCRAFT_ROLL + Math.sin(elapsed * 0.7) * 0.05 + bank,
        -Math.atan2(tangent.z, tangent.x),
        Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z)),
      );
      bank *= BANK_RECOVERY;
    };

    const drawScene = () => {
      if (isHeader) aircraft.rotation.set(0.35, 0.5 + elapsed * HEADER_TURN_SPEED, 0.14);
      else placeOnRoute();

      camera.position.x += (pointer.x * POINTER_REACH - camera.position.x) * 0.04;
      camera.position.y += (-pointer.y * POINTER_REACH - scrollOffset * SCROLL_REACH - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const renderFrame = (time) => {
      // The first frame's timestamp can precede the performance.now() taken when the loop restarted.
      const delta = THREE.MathUtils.clamp((time - lastTime) / 1000, 0, 0.05);
      lastTime = time;
      elapsed += delta;
      drawScene();
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const stopLoop = () => {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const syncLoop = () => {
      stopLoop();
      if (isStillFrame) {
        drawScene();
      } else if (isInView && !document.hidden) {
        lastTime = performance.now();
        frameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const handleScroll = () => {
      const moved = window.scrollY - scrollOffset;
      scrollOffset = window.scrollY;
      if (isHeader) return;
      elapsed += moved * SCROLL_FLIGHT_SECONDS;
      bank = THREE.MathUtils.clamp(bank + moved * BANK_PER_PIXEL, -MAX_BANK, MAX_BANK);
    };
    const handleContextLost = (event) => {
      event.preventDefault();
      stopLoop();
      delete root.dataset.live;
    };

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isInView = entry.isIntersecting;
      syncLoop();
    });
    visibilityObserver.observe(root);

    const resizeObserver = new ResizeObserver(() => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (isStillFrame) drawScene();
    });
    resizeObserver.observe(root);

    const canvas = renderer.domElement;
    if (!keepCameraStill) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      window.addEventListener("scroll", handleScroll, { passive: true });
    }
    document.addEventListener("visibilitychange", syncLoop);
    canvas.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      stopLoop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", syncLoop);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      delete root.dataset.live;
      root.removeChild(canvas);
      disposeScene(scene);
      skyReflection.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [mode]);

  return (
    <div aria-hidden="true" className="aviation-scene" ref={sceneRef}>
      {mode === "flight" && (
        <svg className="scene-fallback" fill="none" viewBox="0 0 600 400">
          <path d="M20 370C170 340 240 300 330 200S470 70 580 30" stroke="#c3d7ff" strokeDasharray="5 9" strokeLinecap="round" strokeOpacity="0.45" strokeWidth="2" />
          <path d="M478 96l30-12 44-44c6-6 16-6 18 0 2 6-2 14-8 20l-44 42-8 38-12 8-8-34-22 18 2 14-8 6-8-20-20-8 6-8 14 2 20-20-34-6 8-12 30 6Z" fill="#f4f7fb" />
        </svg>
      )}
    </div>
  );
}
