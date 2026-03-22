import { useContext } from "react";
import { SceneContext } from "@/components/providers/SceneProvider";

export function useSceneConfig() {
  return useContext(SceneContext);
}
