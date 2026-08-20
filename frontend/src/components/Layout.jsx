import { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { publicApi, API_BASE_URL } from '../services/api';
import './Layout.css';

export default function Layout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth > 1080) {
                setMenuOpen(false);
            }
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    useLayoutEffect(() => {
        publicApi.getSiteSettings().then(raw => {
            const data = Array.isArray(raw) ? Object.fromEntries(raw.map(item => [item.key_name, item.value])) : raw;

            const favicon = data.favicon || '';
            if (!favicon) {
                console.log('[Favicon] empty favicon url, keeping default');
                return;
            }

            const normalized = favicon.trim();
            let faviconUrl;
            if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(normalized)) {
                faviconUrl = normalized;
            } else if (normalized.startsWith('/')) {
                faviconUrl = normalized;
            } else {
                faviconUrl = `/uploads/${normalized}`;
            }

            const href = faviconUrl.startsWith('http')
                ? `${faviconUrl}?v=${encodeURIComponent(favicon)}`
                : `${API_BASE_URL}${faviconUrl}?v=${encodeURIComponent(favicon)}`;

            const img = new Image();
            img.onload = () => {
                document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove());

                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = href;

                const ext = faviconUrl.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase();
                if (ext === 'png') link.type = 'image/png';
                else if (ext === 'svg') link.type = 'image/svg+xml';
                else if (ext === 'webp') link.type = 'image/webp';

                document.head.appendChild(link);
            };
            img.src = href;
        }).catch(err => {
            console.error('[Favicon] failed to load site settings:', err);
        });
    }, []);

    return (
        <ThemeProvider storageKey="public-theme">
        <div className="layout">
            {menuOpen && <div className="menu-overlay visible" onClick={() => setMenuOpen(false)} />}
            <Navbar menuOpen={menuOpen} onToggleSidebar={() => setMenuOpen(!menuOpen)} />
            <main className="main-content">
                <Outlet />
            </main>
            <Footer />
        </div>
        </ThemeProvider>
    );
}
