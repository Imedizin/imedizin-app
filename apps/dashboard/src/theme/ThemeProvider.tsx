import React, { createContext, useContext, useState, useEffect } from "react";
import { ConfigProvider, theme } from "antd";
import { primaryColor } from "./constants";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeState, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("bia-theme") as Theme;
    return saved || "light";
  });

  useEffect(() => {
    localStorage.setItem("bia-theme", themeState);
    document.documentElement.classList.toggle("dark", themeState === "dark");
  }, [themeState]);

  const toggleTheme = () =>
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));

  const isDark = themeState === "dark";

  const contextValue: ThemeContextType = {
    theme: themeState,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: primaryColor,
            colorLink: primaryColor,
            colorLinkHover: "#0a5c5f",
            borderRadius: 8,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Menu: {
              itemBorderRadius: 8,
              itemMarginInline: 8,
              itemSelectedBg: isDark ? "rgba(13, 115, 119, 0.2)" : "#e6f4f4",
              itemSelectedColor: isDark ? "#14b8b8" : primaryColor,
              itemHoverBg: isDark ? "rgba(13, 115, 119, 0.1)" : "#f0f9f9",
            },
            Card: {
              headerBg: "transparent",
            },
            Button: {
              primaryColor: "#ffffff",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
