import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import loadCharacter from "./utils/character";

function lightScene(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight(0xfff0e7, 0xa6899e, 1.58));
  const lights = [
    new THREE.DirectionalLight(0xffe0c7, 2.35),
    new THREE.DirectionalLight(0xc8d8ff, 1.20),
    new THREE.DirectionalLight(0xd79cff, 2.4),
  ];
  lights[0].position.set(-3, 6, 5);
  lights[1].position.set(3, 1, 5);
  lights[2].position.set(2, 4, -4);
  scene.add(...lights);
}

function disposeModel(model: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      const meshMaterials = [object.material].flat() as THREE.Material[];
      meshMaterials.forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

type Props = {
  onFrameChange: (visible: boolean) => void;
  view?: "portrait" | "workstation";
};

const Scene = ({ onFrameChange, view = "portrait" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (failed || !container) return;

    const working = view === "workstation";
    const scene = new THREE.Scene();
    lightScene(scene);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 35);
    const resize = () => {
      const { clientWidth: width, clientHeight: height } = container;
      if (!width || !height) return;
      camera.aspect = width / height;
      if (working) {
        const target = new THREE.Vector3(0, 2.12, 0.60);
        const distance = Math.max(12.85, 9.1 / camera.aspect);
        camera.position.set(-0.79, 0.29, 0.61).normalize().multiplyScalar(distance).add(target);
        camera.lookAt(target);
      } else {
        const distance = Math.max(12.2, 7.25 / camera.aspect);
        camera.position.set(0, 3.28, distance);
        camera.lookAt(0, 2.27, 0.12);
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let visible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibilityObserver.observe(container);

    const controller = new AbortController();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = new THREE.Vector2();
    const projected = new THREE.Vector3();
    const forward = new THREE.Vector3(0, 0.73, 0.45);
    const eyeOffset = new THREE.Vector2();
    let hasPointer = false;
    let model: THREE.Group | undefined;
    let mixer: THREE.AnimationMixer | undefined;

    const aimAtPointer = (event: PointerEvent) => {
      pointer.set(event.clientX, event.clientY);
      hasPointer = true;
    };
    const clearPointer = () => { hasPointer = false; };
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") clearPointer();
    };
    const fail = (error: unknown) => {
      if (controller.signal.aborted) return;
      console.error("Could not display the 3D avatar", error);
      onFrameChange(false);
      setFailed(true);
    };
    const onContextLost = () => fail("WebGL context lost");
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    if (!working) {
      window.addEventListener("pointermove", aimAtPointer, { passive: true });
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", clearPointer);
      window.addEventListener("blur", clearPointer);
      document.documentElement.addEventListener("pointerleave", clearPointer);
    }

    loadCharacter(controller.signal).then((gltf) => {
      if (controller.signal.aborted) {
        disposeModel(gltf.scene);
        return;
      }

      model = gltf.scene;
      const desk = model.getObjectByName("Workstation");
      if (desk) desk.visible = working;
      model.rotation.y = working ? 0 : -0.13;
      const head = model.getObjectByName("Head");
      const eyes = ["Eye_L", "Eye_R"].map((name) => model?.getObjectByName(name));
      const irises = ["Iris_L", "Iris_R"].map((name) => model?.getObjectByName(name));
      const typing = gltf.animations.find(({ name }) => name === "Typing");
      if (!head) throw new Error("The avatar is missing its head joint");

      head.rotation.order = "YXZ";
      head.rotation.y = working ? 0.08 : 0.13;
      if (working) head.rotation.x = 0.18;
      scene.add(model);

      if (typing) {
        mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(typing).play();
      }

      let elapsed = 0;
      let lastTime = performance.now();
      const aimPoint = head.parent!.localToWorld(forward.clone().add(head.position));
      let firstFrame = true;
      renderer.setAnimationLoop((now) => {
        const delta = Math.min(Math.max((now - lastTime) / 1000, 0), 0.05);
        lastTime = now;
        if (!visible || document.hidden) return;

        let x = 0;
        let y = 0;
        if (hasPointer && !reducedMotion.matches) {
          const rect = container.getBoundingClientRect();
          projected.copy(aimPoint).project(camera);
          const faceX = rect.left + rect.width * (projected.x + 1) * 0.5;
          const faceY = rect.top + rect.height * (1 - projected.y) * 0.5;
          x = THREE.MathUtils.clamp((pointer.x - faceX) / (rect.width * 0.46), -1, 1);
          y = THREE.MathUtils.clamp((pointer.y - faceY) / (rect.height * 0.54), -1, 1);
        }

        // At the desk, glance between the display and keys while the finger clip loops.
        const glance = working ? 0.5 - 0.5 * Math.cos(elapsed * 1.35) : 0;
        const yaw = working ? 0.08 - glance * 0.055 : 0.13 + x * 0.53;
        const pitch = working ? 0.18 + glance * 0.12 : y * 0.30;
        head.rotation.y = THREE.MathUtils.damp(head.rotation.y, yaw, 11, delta);
        head.rotation.x = THREE.MathUtils.damp(head.rotation.x, pitch, 10, delta);
        head.rotation.z = THREE.MathUtils.damp(head.rotation.z, -x * 0.045, 8, delta);
        eyeOffset.x = THREE.MathUtils.damp(eyeOffset.x, x * 0.018, 17, delta);
        eyeOffset.y = THREE.MathUtils.damp(eyeOffset.y, -y * 0.012, 17, delta);

        if (!reducedMotion.matches) {
          elapsed += delta;
          mixer?.update(delta);
        }
        const blinkAt = (elapsed + 1.35) % 4.8;
        const blink = blinkAt < 0.18 ? Math.sin(blinkAt / 0.18 * Math.PI) : 0;
        eyes.forEach((eye) => { if (eye) eye.scale.y = 1 - blink * 0.94; });
        irises.forEach((iris) => {
          if (iris) iris.position.set(eyeOffset.x, 0.002 + eyeOffset.y, iris.position.z);
        });

        renderer.render(scene, camera);
        if (firstFrame && renderer.info.render.calls > 0 && !renderer.getContext().isContextLost()) {
          firstFrame = false;
          onFrameChange(true);
        }
      });
    }).catch(fail);

    return () => {
      controller.abort();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener("pointermove", aimAtPointer);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", clearPointer);
      window.removeEventListener("blur", clearPointer);
      document.documentElement.removeEventListener("pointerleave", clearPointer);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.setAnimationLoop(null);
      mixer?.stopAllAction();
      if (model) disposeModel(model);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [failed, onFrameChange, view]);

  return failed ? null : <div className="avatar-canvas" ref={containerRef} aria-hidden="true" />;
};

export default Scene;
