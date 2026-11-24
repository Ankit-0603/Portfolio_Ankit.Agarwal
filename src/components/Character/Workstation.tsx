import { lazy, Suspense, useEffect, useRef, useState } from "react";
import SceneErrorBoundary from "../SceneErrorBoundary";

const Scene = lazy(() => import("./Scene"));
const preview = `${import.meta.env.BASE_URL}models/workstation`;

export default function Workstation() {
  const host = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        observer.disconnect();
      }
    }, { rootMargin: "250px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="what-workstation" ref={host} role="img"
      aria-label="Ankit sitting at his computer, typing with both hands">
      {!live && (
        <picture>
          <source media="(prefers-reduced-motion: reduce)" srcSet={preview + "-still.webp"} />
          <img src={preview + ".webp"} loading="lazy" alt="" />
        </picture>
      )}
      {nearby && (
        <SceneErrorBoundary onError={() => setLive(false)}>
          <Suspense fallback={null}>
            <Scene view="workstation" onFrameChange={setLive} />
          </Suspense>
        </SceneErrorBoundary>
      )}
    </div>
  );
}
