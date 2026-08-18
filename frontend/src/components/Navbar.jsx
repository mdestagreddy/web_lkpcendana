import { Link, useLocation } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useState, useEffect } from 'react';
import { Home, GraduationCap, Users, Image, ClipboardList, Info, Phone, Shield, Menu, X, Sun, Moon, Monitor, FileText, Star } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import AppImage from './Image';
import './Navbar.css';

export default function Navbar({ menuOpen, onToggleSidebar }) {
    const [siteName, setSiteName] = useState('LKP Cendana');
    const [settings, setSettings] = useState({});
    const { themeMode, toggleTheme } = useTheme();
    const location = useLocation();

    useEffect(() => {
        publicApi.getInstitution().then(data => {
            if (data instanceof Array) {
                const map = {};
                data.forEach(item => { map[item.key_name] = item.value; });
                if (map.name) setSiteName(map.name);
            }
        });
        publicApi.getSiteSettings().then(setSettings);
    }, []);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <button
                    className={`sidebar-toggle${menuOpen ? ' open' : ''}`}
                    onClick={onToggleSidebar}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                <Link to="/" className="navbar-brand">
                    {settings.logo_image ? (
                        <AppImage src={settings.logo_image} alt={siteName} className="navbar-logo" />
                    ) : (
                        siteName
                    )}
                </Link>

                <div className="navbar-right">
                    <ul className={`navbar-menu${menuOpen ? ' open' : ''}`}>
                        <li className="menu-header">
                            <span className="menu-title">Menu</span>
                            <button className="menu-close" onClick={onToggleSidebar} aria-label="Close menu">
                                <X size={24} />
                            </button>
                        </li>
                        <li><Link to="/" className={isActive('/')} onClick={() => menuOpen && onToggleSidebar()}><Home size={18} /> <span className="nav-label">Beranda</span></Link></li>
                        <li><Link to="/programs" className={isActive('/programs')} onClick={() => menuOpen && onToggleSidebar()}><GraduationCap size={18} /> <span className="nav-label">Program</span></Link></li>
                        <li><Link to="/instructors" className={isActive('/instructors')} onClick={() => menuOpen && onToggleSidebar()}><Users size={18} /> <span className="nav-label">Instruktur</span></Link></li>
                        <li><Link to="/gallery" className={isActive('/gallery')} onClick={() => menuOpen && onToggleSidebar()}><Image size={18} /> <span className="nav-label">Galeri</span></Link></li>
                        <li><Link to="/posts" className={isActive('/posts')} onClick={() => menuOpen && onToggleSidebar()}><FileText size={18} /> <span className="nav-label">Artikel</span></Link></li>
                        <li><Link to="/reviews" className={isActive('/reviews')} onClick={() => menuOpen && onToggleSidebar()}><Star size={18} /> <span className="nav-label">Ulasan</span></Link></li>
                        <li><Link to="/registration" className={isActive('/registration')} onClick={() => menuOpen && onToggleSidebar()}><ClipboardList size={18} /> <span className="nav-label">Pendaftaran</span></Link></li>
                        <li><Link to="/about" className={isActive('/about')} onClick={() => menuOpen && onToggleSidebar()}><Info size={18} /> <span className="nav-label">Tentang Kami</span></Link></li>
                        <li><Link to="/contact" className={isActive('/contact')} onClick={() => menuOpen && onToggleSidebar()}><Phone size={18} /> <span className="nav-label">Kontak</span></Link></li>
                        <li><Link to="/privacy-policy" className={isActive('/privacy-policy')} onClick={() => menuOpen && onToggleSidebar()}><Shield size={18} /> <span className="nav-label">Kebijakan Privasi</span></Link></li>
                    </ul>

                    <button onClick={toggleTheme} className="theme-toggle-nav" aria-label="Toggle dark mode">
                        {themeMode === 'system' ? <Monitor size={18} /> : themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
