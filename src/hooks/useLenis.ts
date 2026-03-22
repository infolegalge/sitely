import { useContext } from "react";
import { LenisContext } from "@/components/providers/LenisProvider";

export function useLenis() {
  return useContext(LenisContext);
}
