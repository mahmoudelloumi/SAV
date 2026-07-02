import { createContext, useContext, useEffect, useState } from 'react';

// ============================================================
// Contexte de thème (clair/sombre) : persiste le choix de l'utilisateur
// dans localStorage et applique la classe .dark sur <html>, consommée
// par toutes les classes Tailwind `dark:*` de l'application.
// ============================================================

const ThemeContext = createContext(null);

function getPreferenceInitiale() {
  const stocke = localStorage.getItem('theme');
  if (stocke === 'dark' || stocke === 'light') return stocke;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferenceInitiale);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Utilisation : const { theme, toggleTheme } = useTheme();
export function useTheme() {
  return useContext(ThemeContext);
}
