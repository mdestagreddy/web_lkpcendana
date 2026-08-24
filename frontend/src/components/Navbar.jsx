import { Link, useLocation } from 'react-router-dom';
import { publicApi } from '../services/api';
import { useState, useEffect } from 'react';
import { Home, GraduationCap, Users, Image, ClipboardList, Info, Phone, Shield, X, Sun, Moon, Monitor, FileText, Star } from 'lucide-react';
import FlexIcon from './FlexIcon';
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
                    <span></span>
                    <span></span>
                    <span></span>
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
                        <li><Link to="/" className={isActive('/')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Home} size={18}>Beranda</FlexIcon></Link></li>
                        <li><Link to="/programs" className={isActive('/programs')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={GraduationCap} size={18}>Program</FlexIcon></Link></li>
                        <li><Link to="/instructors" className={isActive('/instructors')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Users} size={18}>Instruktur</FlexIcon></Link></li>
                        <li><Link to="/gallery" className={isActive('/gallery')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Image} size={18}>Galeri</FlexIcon></Link></li>
                        <li><Link to="/posts" className={isActive('/posts')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={FileText} size={18}>Artikel</FlexIcon></Link></li>
                        <li><Link to="/reviews" className={isActive('/reviews')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Star} size={18}>Ulasan</FlexIcon></Link></li>
                        <li><Link to="/registration" className={isActive('/registration')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={ClipboardList} size={18}>Pendaftaran</FlexIcon></Link></li>
                        <li><Link to="/about" className={isActive('/about')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Info} size={18}>Tentang Kami</FlexIcon></Link></li>
                        <li><Link to="/contact" className={isActive('/contact')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Phone} size={18}>Kontak</FlexIcon></Link></li>
                        <li><Link to="/privacy-policy" className={isActive('/privacy-policy')} onClick={() => menuOpen && onToggleSidebar()}><FlexIcon Icon={Shield} size={18}>Kebijakan Privasi</FlexIcon></Link></li>
                    </ul>

                    <button onClick={toggleTheme} className="theme-toggle-nav" aria-label="Toggle dark mode">
                        {themeMode === 'system' ? <FlexIcon Icon={Monitor} size={18} /> : themeMode === 'dark' ? <FlexIcon Icon={Sun} size={18} /> : <FlexIcon Icon={Moon} size={18} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
