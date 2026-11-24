import { GLTFLoader } from "three-stdlib";

const loadCharacter = async (signal: AbortSignal) => {
  const folder = `${import.meta.env.BASE_URL}models/`;
  const response = await fetch(`${folder}ankit-avatar.glb`, { signal });
  if (!response.ok) {
    throw new Error(`Avatar request failed with HTTP ${response.status}`);
  }
  const model = await response.arrayBuffer();
  signal.throwIfAborted();
  return new GLTFLoader().parseAsync(model, folder);
};

export default loadCharacter;
