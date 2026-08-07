"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const colorPresets = [
  { value: "indigo", label: "Indigo", swatch: "oklch(0.51 0.22 264)" },
  { value: "emerald", label: "Emerald", swatch: "oklch(0.51 0.22 155)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.51 0.22 350)" },
  { value: "amber", label: "Amber", swatch: "oklch(0.51 0.22 75)" },
] as const;

export type ColorPreset = (typeof colorPresets)[number]["value"];

const STORAGE_KEY = "color-preset";
const DEFAULT_PRESET: ColorPreset = "indigo";

type ColorPresetContextValue = {
  preset: ColorPreset;
  setPreset: (preset: ColorPreset) => void;
  presets: typeof colorPresets;
};

const ColorPresetContext = createContext<ColorPresetContextValue | undefined>(undefined);

function applyPreset(preset: ColorPreset) {
  document.documentElement.setAttribute("data-color-preset", preset);
}

export function ColorPresetProvider({ children }: { children: ReactNode }) {
  const [preset, setPresetState] = useState<ColorPreset>(DEFAULT_PRESET);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ColorPreset | null;
    if (stored && colorPresets.some((p) => p.value === stored)) {
      setPresetState(stored);
    }
  }, []);

  const setPreset = useCallback((next: ColorPreset) => {
    setPresetState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyPreset(next);
  }, []);

  return (
    <ColorPresetContext.Provider value={{ preset, setPreset, presets: colorPresets }}>
      {children}
    </ColorPresetContext.Provider>
  );
}

export function useColorPreset() {
  const context = useContext(ColorPresetContext);
  if (!context) {
    throw new Error("useColorPreset must be used within a ColorPresetProvider");
  }
  return context;
}
