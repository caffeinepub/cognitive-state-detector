import { createContext, useContext, useEffect, useState } from "react";

interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  accessibleCalibration: boolean;
  eyeGazeMode: boolean;
  blinkMode: boolean;
  autoAdvanceMode: boolean;
}

const DEFAULT: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largeText: false,
  accessibleCalibration: false,
  eyeGazeMode: false,
  blinkMode: false,
  autoAdvanceMode: false,
};

interface AccessibilityContextValue extends AccessibilitySettings {
  update: (key: keyof AccessibilitySettings, value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue>({
  ...DEFAULT,
  update: () => {},
});

export function AccessibilityProvider({
  children,
}: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem("accessibility-settings");
      return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    const html = document.documentElement;
    html.classList.toggle("high-contrast", settings.highContrast);
    html.classList.toggle("reduce-motion", settings.reduceMotion);
    html.classList.toggle("large-text", settings.largeText);
  }, [settings]);

  const update = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AccessibilityContext.Provider value={{ ...settings, update }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
