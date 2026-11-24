import { lazy, Suspense, useCallback, useState } from "react";
import "./App.css";
import SceneErrorBoundary from "./components/SceneErrorBoundary";
import AvatarPortrait from "./components/AvatarPortrait";
import { LoadingProvider, useLoading } from "./context/LoadingProvider";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));

const Character = () => {
  const { setLoading } = useLoading();
  const [live, setLive] = useState(false);
  const reportFrame = useCallback((visible: boolean) => {
    setLive(visible);
    if (visible) setLoading(100);
  }, [setLoading]);

  return (
    <div className="character-model" role="img" aria-label="Seated developer wearing glasses and headphones">
      {!live && <AvatarPortrait onLoad={() => setLoading(100)} />}
      <SceneErrorBoundary onError={() => setLive(false)}>
        <Suspense fallback={null}>
          <CharacterModel onFrameChange={reportFrame} />
        </Suspense>
      </SceneErrorBoundary>
    </div>
  );
};

const App = () => {
  return (
    <>
      <LoadingProvider>
        <Suspense>
          <MainContainer>
            <Character />
          </MainContainer>
        </Suspense>
      </LoadingProvider>
    </>
  );
};

export default App;
