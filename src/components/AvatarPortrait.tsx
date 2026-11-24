import { useEffect, useRef } from "react";
import views from "../assets/avatar-views.webp";

type Props = { onLoad: () => void };

// The sheet contains five head turns at each of three vertical gaze angles.
export default function AvatarPortrait({ onLoad }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function neutral() {
      image!.style.removeProperty("transform");
    }
    function follow(event: PointerEvent) {
      if (motion.matches) return;
      const rect = frame!.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const dx = (event.clientX - rect.left - rect.width / 2) / (window.innerWidth * 0.46);
      const dy = (event.clientY - rect.top - rect.height * 0.21) / (rect.height * 0.54);
      const column = Math.max(0, Math.min(4, 2 + Math.round(dx * 2)));
      const row = Math.max(0, Math.min(2, 1 + Math.round(dy)));
      image!.style.transform = `translate(${-20 * column}%, ${-100 * row / 3}%)`;
    }
    function release(event: PointerEvent) {
      if (event.pointerType === "touch") neutral();
    }
    window.addEventListener("pointermove", follow, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", neutral);
    window.addEventListener("blur", neutral);
    document.documentElement.addEventListener("pointerleave", neutral);
    motion.addEventListener("change", neutral);
    return () => {
      window.removeEventListener("pointermove", follow);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", neutral);
      window.removeEventListener("blur", neutral);
      document.documentElement.removeEventListener("pointerleave", neutral);
      motion.removeEventListener("change", neutral);
    };
  }, []);

  return (
    <div className="avatar-portrait" ref={frameRef}>
      <img ref={imageRef} src={views} alt="" onLoad={onLoad} onError={onLoad} />
    </div>
  );
}
