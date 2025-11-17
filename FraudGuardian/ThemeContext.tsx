import React, { createContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightThemeColors, DarkThemeColors } from "./constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Mode = "light" | "dark";

export const ThemeContext = createContext({
  mode: "light" as Mode,
  theme: LightThemeColors,
  toggleTheme: async () => {},
});

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() === "dark" ? "dark" : "light";

  const [mode, setMode] = useState<Mode>(system);

  const theme = mode === "dark" ? DarkThemeColors : LightThemeColors;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("app_theme");
      if (saved === "light" || saved === "dark") {
        setMode(saved);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const m: Mode = mode === "light" ? "dark" : "light";
    setMode(m);
    await AsyncStorage.setItem("app_theme", m);
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
