import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

const products = [
  {
    id: "KMT-006",
    name: "NC2528RL1 / NC-225R0L1",
    type: "锡膏系列 · 有铅 Sn63Pb37",
    model: "products/models/nc2528rl1-jar.glb",
    desc:
      "用途：适合传统有铅 SMT 制程、连接器焊接、维修返工和补焊场景。Sn63Pb37 共晶体系熔点稳定，便于获得饱满焊点和较宽工艺窗口，适合非 RoHS 要求的成熟电子装联产线。",
    specs: [
      ["核心特性", "Sn63Pb37 共晶体系，熔点稳定，焊点饱满，适合成熟有铅制程。"],
      ["应用", "聚焦 SMT 印刷、连接器焊接、维修返工与补焊场景。"],
      ["支持", "提供工艺窗口调试、回流参数建议和非 RoHS 产线适配指导。"],
    ],
  },
  {
    id: "KMT-005",
    name: "NC2623T3 / NC-623T3-MA",
    type: "锡膏系列 · 有铅含银 Sn63Pb36.6Ag0.4",
    model: "products/models/nc2623t3-jar.glb",
    desc:
      "用途：用于传统含铅 SMT 印刷、贴装和回流焊，也适合维修、返修与工控产品生产。少量银元素有助于改善润湿、焊点外观和连接可靠性。",
    specs: [
      ["核心特性", "Sn63Pb36.6Ag0.4 含银共晶体系，润湿性好，焊点外观稳定。"],
      ["应用", "适用于传统 SMT 印刷、维修返修、工控板和成熟含铅制程。"],
      ["支持", "提供含铅工艺窗口、回流曲线和非 RoHS 产线适配建议。"],
    ],
  },
  {
    id: "KMT-004",
    name: "NC3380RL1 Front / NC-388R0L1",
    type: "锡膏系列 · 无铅 SAC305",
    model: "products/models/nc3380rl1-front.glb",
    desc:
      "用途：面向 RoHS 无铅 SMT 批量生产，适合通信设备、服务器主板、电源模块和功率器件焊接。SAC305 合金体系兼顾润湿性、焊点强度和热循环可靠性。",
  },
  {
    id: "KMT-003",
    name: "NC3380RL1 / NC-338R0L1",
    type: "锡膏系列 · 低银无铅 SnAg0.3Cu0.7",
    model: "products/models/nc3380rl1-jar.glb",
    desc:
      "用途：适合车载电子、电源控制板、工业控制板等无铅生产场景。低银配方有利于控制材料成本，同时保持常规 SMT 回流焊所需的印刷稳定性与焊点成形。",
  },
  {
    id: "KMT-007",
    name: "NC3880RL1 / NC-388R0L1",
    type: "锡膏系列 · 无铅 SnAg1.0Cu0.5",
    model: "products/models/nc3880rl1-jar.glb",
    desc:
      "用途：适用于消费电子、LED 电源、通用控制板和中等可靠性要求的 SMT 批量生产。在银含量、材料成本、润湿性能和焊点可靠性之间取得平衡。",
  },
  {
    id: "KMT-002",
    name: "NC5280RL1 Front / NC-528R0L1",
    type: "锡膏系列 · 低温铋银 Sn64.7Bi35Ag0.3",
    model: "products/models/nc5280rl1-front.glb",
    desc:
      "用途：用于热敏元件、精密模块、低温回流和分步焊接工艺。较低回流温度可帮助减少元件热冲击、降低 PCB 翘曲风险，适合对温度敏感的装联产品。",
  },
  {
    id: "KMT-001",
    name: "NC5280RL1 / NC-528R0L1",
    type: "锡膏系列 · 低温 Sn42Bi58",
    model: "products/models/nc5280rl1-jar.glb",
    desc:
      "用途：适合低温焊接、热敏器件、模块贴片和需要降低整体回流温度的电子制造场景。Sn-Bi 体系可用于减少热损伤和改善低温装联工艺适配。",
  },
  {
    id: "KMT-010",
    name: "NC5280RL1 Side / NC-528R0L1",
    type: "锡膏系列 · 低温铋银 Sn64Bi35Ag1.0",
    model: "products/models/nc5280rl1-side.glb",
    desc:
      "用途：用于中低温 SMT、热敏模块和对焊点成形要求更高的低温无铅制程。Ag1.0 版本更强调润湿、焊点外观和综合可靠性，适合量产导入前验证。",
  },
  {
    id: "KMT-009",
    name: "SMT Red Adhesive Label / D856",
    type: "SMT 红胶 · 贴片胶 300g",
    model: "products/models/smt-red-adhesive-label.glb",
    desc:
      "用途：用于 SMT 贴片固定、波峰焊前定位、双面贴装和混装工艺。可帮助元件在搬运、预热和焊接过程中保持位置稳定，降低偏移、掉件和后段焊接风险。",
  },
  {
    id: "KMT-008",
    name: "SMT Red Adhesive Syringe / D856",
    type: "SMT 红胶 · 点胶包装 360g",
    model: "products/models/smt-red-adhesive-syringe.glb",
    desc:
      "用途：适合点胶设备、局部施胶、小批量验证和工艺补胶。针筒包装便于控制出胶量和点胶位置，服务波峰焊前固定、混装板定位和现场工艺调试。",
  },
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHoverPause = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobileMotion = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
const modelData = window.PRODUCT_MODEL_URIS || {};
const ringStep = (Math.PI * 2) / products.length;
const autoRotateResumeDelay = 5000;
const autoRotateSpeed = isMobileMotion ? 0.08 : 0.12;
const smoothFactor = reduceMotion ? 1 : 0.045;
const canvasDpr = isMobileMotion ? [1, 1.5] : [1.25, 2];
const shadowMapSize = isMobileMotion ? 1024 : 2048;

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(error);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function getModelUrl(path) {
  return modelData[path] || modelData[path.split("/").pop()] || path;
}

function getFallbackSpecs(product) {
  if (product.type.includes("红胶")) {
    return [
      ["核心特性", "稳定点胶与固化表现，帮助元件在搬运、预热和焊接前保持定位。"],
      ["应用", "适合 SMT 贴片固定、波峰焊前定位、双面贴装和混装工艺。"],
      ["支持", "提供点胶量、固化条件、储存回温和现场工艺参数建议。"],
    ];
  }

  if (product.type.includes("低温")) {
    return [
      ["核心特性", "低温回流窗口，降低热冲击和 PCB 翘曲风险，适配热敏器件。"],
      ["应用", "适合精密模块、热敏元件、低温回流和分步焊接场景。"],
      ["支持", "提供回流曲线、印刷参数、回温管理和量产导入验证建议。"],
    ];
  }

  if (product.type.includes("无铅")) {
    return [
      ["核心特性", "面向 RoHS 无铅制程，兼顾印刷稳定、润湿表现和焊点可靠性。"],
      ["应用", "适合消费电子、电源控制板、工业控制板和通用 SMT 批量生产。"],
      ["支持", "提供无铅回流窗口、钢网印刷参数和现场异常分析建议。"],
    ];
  }

  return [
    ["核心特性", "成熟锡膏体系，印刷释放稳定，适合批量电子装联。"],
    ["应用", "适合 SMT 印刷、贴装、回流焊和常规电子制造场景。"],
    ["支持", "提供选型沟通、资料下载、样品验证和现场工艺建议。"],
  ];
}

function updatePanel(index) {
  const product = products[index];
  const focusPanel = document.querySelector(".focus-panel");
  const focusType = document.querySelector("#focusType");
  const focusTitle = document.querySelector("#focusTitle");
  const focusDesc = document.querySelector("#focusDesc");
  const focusCount = document.querySelector("#focusCount");
  const progressBar = document.querySelector("#progressBar");
  const productCenterLink = document.querySelector("#productCenterLink");
  const specNodes = [
    [document.querySelector("#specLabelOne"), document.querySelector("#specTextOne")],
    [document.querySelector("#specLabelTwo"), document.querySelector("#specTextTwo")],
    [document.querySelector("#specLabelThree"), document.querySelector("#specTextThree")],
  ];
  const specs = product.specs || getFallbackSpecs(product);

  if (focusType) focusType.textContent = product.type;
  if (focusTitle) focusTitle.textContent = product.name;
  if (focusDesc) focusDesc.textContent = product.desc;
  if (focusCount) focusCount.textContent = `${String(index + 1).padStart(2, "0")} / ${products.length}`;
  if (progressBar) progressBar.style.setProperty("--progress", `${((index + 1) / products.length) * 100}%`);
  specNodes.forEach(([labelNode, textNode], specIndex) => {
    if (labelNode) labelNode.textContent = specs[specIndex]?.[0] || "";
    if (textNode) textNode.textContent = specs[specIndex]?.[1] || "";
  });
  if (productCenterLink) {
    productCenterLink.href = `products.html?preview=${encodeURIComponent(product.id)}`;
    productCenterLink.textContent = `查看产品中心 · ${product.id}`;
  }
  if (focusPanel) {
    focusPanel.classList.remove("is-switching");
    void focusPanel.offsetWidth;
    focusPanel.classList.add("is-switching");
  }
}

function ProductModel({ product, index, activeIndex, onReady, onSelect, onHoverChange }) {
  const group = useRef();
  const gltf = useLoader(GLTFLoader, getModelUrl(product.model));
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useLayoutEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    scene.position.sub(center);
    const maxAxis = Math.max(size.x, size.y, size.z);
    scene.scale.setScalar(maxAxis > 0 ? 1.46 / maxAxis : 1);
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.productIndex = index;
      if (child.material) child.material.needsUpdate = true;
    });
  }, [scene, index]);

  useEffect(() => {
    onReady();
  }, [onReady]);

  useFrame((state) => {
    const item = group.current;
    if (!item) return;
    const diff = Math.abs(((index - activeIndex + products.length / 2) % products.length) - products.length / 2);
    const selected = index === activeIndex;
    const targetScale = selected ? 1.42 : Math.max(0.5, 0.7 - diff * 0.052);
    item.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), selected ? 0.075 : 0.06);
    item.position.y += ((selected ? -0.08 : -0.12) - item.position.y) * 0.075;
    item.rotation.x = Math.sin(state.clock.elapsedTime * 0.45 + index) * (selected ? 0.018 : 0.012);
  });

  const angle = index * ringStep;
  return (
    <group
      ref={group}
      position={[Math.sin(angle) * 3.85, 0, Math.cos(angle) * 3.85]}
      rotation={[0, angle, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (canHoverPause) onHoverChange(true);
      }}
      onPointerOut={() => {
        if (canHoverPause) onHoverChange(false);
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

function ProductRing({ activeIndex, setActive, setLoaded, isPaused, setPaused }) {
  const ring = useRef();
  const targetRotation = useRef(0);
  const lastInteraction = useRef(performance.now());
  const readySet = useRef(new Set());

  useEffect(() => {
    targetRotation.current = -activeIndex * ringStep;
    lastInteraction.current = performance.now();
  }, [activeIndex]);

  useFrame((_, delta) => {
    if (!ring.current) return;
    if (!reduceMotion && !isPaused && performance.now() - lastInteraction.current > autoRotateResumeDelay) {
      targetRotation.current += delta * autoRotateSpeed;
    }
    ring.current.rotation.y += (targetRotation.current - ring.current.rotation.y) * smoothFactor;
    ring.current.children.forEach((child, index) => {
      const selected = index === activeIndex;
      const targetYaw = selected ? -ring.current.rotation.y : index * ringStep - ring.current.rotation.y;
      const angleDelta = Math.atan2(Math.sin(targetYaw - child.rotation.y), Math.cos(targetYaw - child.rotation.y));
      child.rotation.y += angleDelta * (selected ? 0.095 : 0.055);
    });
  });

  const markReady = (index) => {
    readySet.current.add(index);
    setLoaded(readySet.current.size);
  };

  return (
    <group ref={ring}>
      {products.map((product, index) => (
        <Suspense key={product.model} fallback={null}>
          <ProductModel
            product={product}
            index={index}
            activeIndex={activeIndex}
            onReady={() => markReady(index)}
            onSelect={setActive}
            onHoverChange={setPaused}
          />
        </Suspense>
      ))}
    </group>
  );
}

function Scene({ activeIndex, setActive, setLoaded, isPaused, setPaused }) {
  return (
    <>
      <ambientLight intensity={0.72} color="#f7fbfb" />
      <hemisphereLight args={[0xffffff, 0x9aa8ad, 1.85]} />
      <directionalLight position={[-4.5, 7, 6]} intensity={2.45} castShadow shadow-mapSize={[shadowMapSize, shadowMapSize]} />
      <directionalLight position={[5, 3.8, -5.8]} intensity={0.95} color="#e7fffb" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]} renderOrder={-1}>
        <circleGeometry args={[4.0, 112]} />
        <meshBasicMaterial color="#dfe8eb" transparent opacity={0.32} side={THREE.DoubleSide} depthWrite={false} depthTest={false} />
      </mesh>
      <ProductRing activeIndex={activeIndex} setActive={setActive} setLoaded={setLoaded} isPaused={isPaused} setPaused={setPaused} />
    </>
  );
}

function Stage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [isHidden, setHidden] = useState(document.hidden);
  const [hasSceneError, setSceneError] = useState(false);
  const lastWheel = useRef(0);

  const setActive = (index) => {
    setActiveIndex((index + products.length) % products.length);
  };

  useEffect(() => {
    updatePanel(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const status = document.querySelector("#loadingStatus");
    if (!status) return;
    if (hasSceneError) {
      status.innerHTML = '<span>3D 模型加载失败</span><button type="button" id="retryThreeButton">重试</button>';
      status.classList.remove("is-hidden");
      document.querySelector("#retryThreeButton")?.addEventListener("click", () => window.location.reload(), { once: true });
      return;
    }
    status.textContent = loaded >= products.length ? "" : `正在加载 3D 模型 ${loaded} / ${products.length}`;
    status.classList.toggle("is-hidden", loaded >= products.length);
  }, [loaded, hasSceneError]);

  useEffect(() => {
    const handleVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const wheel = (event) => {
      const now = performance.now();
      if (Math.abs(event.deltaY) < 18 || now - lastWheel.current < 520) return;
      event.preventDefault();
      lastWheel.current = now;
      setActiveIndex((current) => (current + (event.deltaY > 0 ? 1 : -1) + products.length) % products.length);
    };
    const keydown = (event) => {
      if (event.key === "ArrowRight" || event.key === "ArrowDown") setActiveIndex((current) => (current + 1) % products.length);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") setActiveIndex((current) => (current - 1 + products.length) % products.length);
    };
    const prev = document.querySelector("#prevButton");
    const next = document.querySelector("#nextButton");
    const prevClick = () => setActiveIndex((current) => (current - 1 + products.length) % products.length);
    const nextClick = () => setActiveIndex((current) => (current + 1) % products.length);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", keydown);
    prev?.addEventListener("click", prevClick);
    next?.addEventListener("click", nextClick);
    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", keydown);
      prev?.removeEventListener("click", prevClick);
      next?.removeEventListener("click", nextClick);
    };
  }, []);

  return (
    <Canvas
      shadows
      dpr={canvasDpr}
      camera={{ position: [0, 2.16, 10.1], fov: 32, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => setPaused(false)}
      onPointerLeave={() => setPaused(true)}
      onCreated={({ gl, camera }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
        gl.shadowMap.enabled = true;
        gl.shadowMap.type = THREE.PCFShadowMap;
        camera.lookAt(0, 0.06, 0);
      }}
    >
      <SceneErrorBoundary onError={() => setSceneError(true)}>
        <Scene activeIndex={activeIndex} setActive={setActive} setLoaded={setLoaded} isPaused={isPaused || isHidden} setPaused={setPaused} />
      </SceneErrorBoundary>
    </Canvas>
  );
}

createRoot(document.querySelector("#threeStage")).render(<Stage />);
