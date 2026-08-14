import { createContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

function getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children, storageKey }) {
    const [themeMode, setThemeMode] = useState(() => {
        const stored = localStorage.getItem(storageKey);
        return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
    });

    const [systemTheme, setSystemTheme] = useState(() => getSystemTheme());

    const resolvedTheme = themeMode === 'system' ? systemTheme : themeMode;

    useEffect(() => {
        const root = document.documentElement;
        if (resolvedTheme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
        localStorage.setItem(storageKey, themeMode);
    }, [resolvedTheme, themeMode, storageKey]);

    useEffect(() => {
        if (themeMode !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themeMode]);

    function toggleTheme() {
        setThemeMode(prev => {
            if (prev === 'light') return 'dark';
            if (prev === 'dark') return 'system';
            return 'light';
        });
    }

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export { ThemeContext };
