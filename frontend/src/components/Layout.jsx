import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { publicApi } from '../services/api';
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

    useEffect(() => {
        publicApi.getSiteSettings().then(data => {
            const faviconUrl = data.favicon || '';
            if (faviconUrl) {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) {
                    link = document.createElement('link');
                    link.rel = 'icon';
                    document.head.appendChild(link);
                }
                link.href = faviconUrl;
            }
        }).catch(() => {});
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
