import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Legacy Three.js prototype kept for reference. The active homepage 3D entry
// is src/r3f-app.jsx, built into dist/r3f/app.js by tools/build-r3f-bundle.js.

      const products = [
        {
          name: "NC2528RL1",
          type: "锡膏系列",
          model: "products/models/nc2528rl1-jar.glb",
          desc: "适合连续印刷与批量装配的锡膏方案，帮助产线保持稳定铺展与一致焊点表现。"
        },
        {
          name: "NC2623T3",
          type: "锡膏系列",
          model: "products/models/nc2623t3-jar.glb",
          desc: "面向细间距印刷和稳定回流需求，强调批次一致性与工艺窗口控制。"
        },
        {
          name: "NC3380RL1",
          type: "锡膏系列",
          model: "products/models/nc3380rl1-jar.glb",
          desc: "为电子制造批量应用准备，兼顾印刷稳定性、焊点可靠性与现场操作效率。"
        },
        {
          name: "NC3380RL1 Front",
          type: "锡膏系列",
          model: "products/models/nc3380rl1-front.glb",
          desc: "正面标签展示型号识别信息，便于产线仓储、领料和工艺追踪。"
        },
        {
          name: "NC3880RL1",
          type: "锡膏系列",
          model: "products/models/nc3880rl1-jar.glb",
          desc: "适用于对产线节拍和焊接一致性有要求的 SMT 应用场景。"
        },
        {
          name: "NC5280RL1",
          type: "锡膏系列",
          model: "products/models/nc5280rl1-jar.glb",
          desc: "为稳定印刷、良好润湿和持续生产节奏设计，适合多品种制造现场。"
        },
        {
          name: "NC5280RL1 Front",
          type: "锡膏系列",
          model: "products/models/nc5280rl1-front.glb",
          desc: "清晰标签便于现场识别，支持从样品验证到批量交付的材料管理。"
        },
        {
          name: "NC5280RL1 Side",
          type: "锡膏系列",
          model: "products/models/nc5280rl1-side.glb",
          desc: "侧向包装视角展示容器结构，便于页面中呈现真实产品体积与质感。"
        },
        {
          name: "SMT Red Adhesive Label",
          type: "SMT 红胶",
          model: "products/models/smt-red-adhesive-label.glb",
          desc: "适用于贴片固定相关流程，强化物料识别和现场工艺管理。"
        },
        {
          name: "SMT Red Adhesive Syringe",
          type: "SMT 红胶",
          model: "products/models/smt-red-adhesive-syringe.glb",
          desc: "针筒包装适合点胶应用，服务于元件固定、工艺补充与小批量作业。"
        }
      ];

      const modelData = window.PRODUCT_MODEL_URIS || {};
      const shouldUseEmbeddedModels = window.location.protocol === "file:";
      products.forEach((product) => {
        const filename = product.model.split("/").pop();
        if (shouldUseEmbeddedModels && modelData[filename]) {
          product.model = modelData[filename];
        }
      });

      const canvas = document.querySelector("#threeStage");
      const loadingStatus = document.querySelector("#loadingStatus");
      const focusType = document.querySelector("#focusType");
      const focusTitle = document.querySelector("#focusTitle");
      const focusDesc = document.querySelector("#focusDesc");
      const focusCount = document.querySelector("#focusCount");
      const progressBar = document.querySelector("#progressBar");
      const prevButton = document.querySelector("#prevButton");
      const nextButton = document.querySelector("#nextButton");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(0, 1.82, 8.35);
      camera.lookAt(0, 0.18, 0);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;

      const ringGroup = new THREE.Group();
      scene.add(ringGroup);

      const ambient = new THREE.HemisphereLight(0xffffff, 0x6b7280, 2.1);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(-4.5, 7, 6);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0xd8fffb, 1.4);
      rimLight.position.set(5, 3.8, -5.8);
      scene.add(rimLight);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(3.8, 96),
        new THREE.MeshBasicMaterial({
          color: 0xdce7ec,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -1.18;
      scene.add(floor);

      const loader = new GLTFLoader();
      const productGroups = [];
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let lastFrameTime = performance.now();
      let elapsedTime = 0;

      let activeIndex = 0;
      let targetRotation = 0;
      let lastWheelTime = 0;
      let lastInteractionTime = Date.now();
      let loadedCount = 0;

      const formatNumber = (value) => String(value + 1).padStart(2, "0");
      const step = (Math.PI * 2) / products.length;
      const radius = 3.15;

      function normalizeModel(model, index) {
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        model.position.sub(center);

        const maxAxis = Math.max(size.x, size.y, size.z);
        const scale = maxAxis > 0 ? 1.35 / maxAxis : 1;
        model.scale.setScalar(scale);
        model.rotation.x = 0;
        model.userData.productIndex = index;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.productIndex = index;
            if (child.material) {
              child.material.depthWrite = child.material.transparent ? false : child.material.depthWrite;
              child.material.needsUpdate = true;
            }
          }
        });
      }

      function placeProduct(group, index) {
        const angle = index * step;
        group.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
        group.rotation.y = angle;
      }

      function loadProducts() {
        products.forEach((product, index) => {
          const holder = new THREE.Group();
          holder.name = product.name;
          holder.userData.productIndex = index;
          placeProduct(holder, index);
          holder.scale.setScalar(0.62);
          productGroups[index] = holder;
          ringGroup.add(holder);

          loader.load(
            product.model,
            (gltf) => {
              const model = gltf.scene;
              normalizeModel(model, index);
              holder.add(model);
              loadedCount += 1;
              loadingStatus.textContent = `正在加载 3D 模型 ${loadedCount} / ${products.length}`;
              if (loadedCount === products.length) {
                loadingStatus.classList.add("is-hidden");
              }
              renderProductState();
            },
            undefined,
            () => {
              loadedCount += 1;
              loadingStatus.textContent = `部分模型加载失败 ${loadedCount} / ${products.length}`;
            }
          );
        });
      }

      function shortestDistance(index, active) {
        let diff = index - active;
        if (diff > products.length / 2) diff -= products.length;
        if (diff < -products.length / 2) diff += products.length;
        return diff;
      }

      function renderProductState() {
        productGroups.forEach((group, index) => {
          if (!group) return;
          const diff = Math.abs(shortestDistance(index, activeIndex));
          const isActive = index === activeIndex;
          const scale = isActive ? 1.05 : Math.max(0.48, 0.72 - diff * 0.05);
          group.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.18);
          group.position.y += ((isActive ? 0.18 : -0.08) - group.position.y) * 0.16;
        });
      }

      function updateInfo() {
        const activeProduct = products[activeIndex];
        focusType.textContent = activeProduct.type;
        focusTitle.textContent = activeProduct.name;
        focusDesc.textContent = activeProduct.desc;
        focusCount.textContent = `${formatNumber(activeIndex)} / ${products.length}`;
        progressBar.style.setProperty("--progress", `${((activeIndex + 1) / products.length) * 100}%`);
      }

      function setActive(index) {
        activeIndex = (index + products.length) % products.length;
        targetRotation = -activeIndex * step;
        lastInteractionTime = Date.now();
        updateInfo();
      }

      function nudge(direction) {
        setActive(activeIndex + direction);
      }

      function resizeRenderer() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      function animate() {
        const now = performance.now();
        const delta = Math.min(0.05, (now - lastFrameTime) / 1000);
        lastFrameTime = now;
        elapsedTime += delta;
        if (!reduceMotion && Date.now() - lastInteractionTime > 1300) {
          targetRotation += delta * 0.22;
        }

        ringGroup.rotation.y += (targetRotation - ringGroup.rotation.y) * 0.075;
        productGroups.forEach((group, index) => {
          if (!group) return;
          const activeBoost = index === activeIndex ? 0.28 : 0.12;
          group.rotation.y = index * step - ringGroup.rotation.y + Math.PI + Math.sin(elapsedTime * 0.8 + index) * 0.035;
          group.rotation.x = Math.sin(elapsedTime * 0.7 + index) * activeBoost * 0.06;
        });
        renderProductState();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      window.addEventListener(
        "wheel",
        (event) => {
          const now = Date.now();
          if (Math.abs(event.deltaY) < 18 || now - lastWheelTime < 540) return;
          event.preventDefault();
          lastWheelTime = now;
          nudge(event.deltaY > 0 ? 1 : -1);
        },
        { passive: false }
      );

      window.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nudge(1);
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nudge(-1);
      });

      canvas.addEventListener("click", (event) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(ringGroup.children, true);
        const hit = hits.find((entry) => Number.isInteger(entry.object.userData.productIndex));
        if (hit) setActive(hit.object.userData.productIndex);
      });

      prevButton.addEventListener("click", () => nudge(-1));
      nextButton.addEventListener("click", () => nudge(1));
      window.addEventListener("resize", resizeRenderer);

      resizeRenderer();
      updateInfo();
      loadProducts();
      animate();
