import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { ThemeProvider } from '../../context/ThemeContext';
import { LayoutDashboard, GraduationCap, Users, MessageSquare, Image, UserCog, Building2, Target, Settings, FileText, Tag, GitBranch, Shield, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import './AdminLayout.css';

function AdminLayoutInner() {
    const { user, logout, loading } = useAuth();
    const { themeMode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [location.pathname]);

    const sidebarOpenRef = useRef(false);

    const handleResize = () => {
        if (window.innerWidth >= 768 && sidebarOpenRef.current) {
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        sidebarOpenRef.current = sidebarOpen;

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [sidebarOpen]);

    if (loading) {
        return <div className="admin-layout"><main className="admin-content"><p>Memuat...</p></main></div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    function handleLogout() {
        logout();
        navigate('/admin/login');
    }

    return (
        <div className="admin-layout">
            <aside className={`admin-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-header-top">
                        <h2>Panel Admin</h2>
                        <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle dark mode">
                            {themeMode === 'system' ? <Monitor size={18} /> : themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                    <p className="user-name">{user.nama}</p>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><LayoutDashboard size={18} /> Dasbor</NavLink>
                    <NavLink to="/admin/programs" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><GraduationCap size={18} /> Program</NavLink>
                    <NavLink to="/admin/instructors" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Users size={18} /> Instruktur</NavLink>
                    <NavLink to="/admin/testimonials" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><MessageSquare size={18} /> Testimoni</NavLink>
                    <NavLink to="/admin/gallery" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Image size={18} /> Galeri</NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><UserCog size={18} /> Pengguna</NavLink>
                    <NavLink to="/admin/institution" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Building2 size={18} /> Institusi</NavLink>
                    <NavLink to="/admin/vision-mission" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Target size={18} /> Visi/Misi</NavLink>
                    <NavLink to="/admin/site-settings" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Settings size={18} /> Pengaturan Situs</NavLink>
                    <NavLink to="/admin/posts" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><FileText size={18} /> Artikel</NavLink>
                    <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Tag size={18} /> Kategori</NavLink>
                    <NavLink to="/admin/org-chart" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><GitBranch size={18} /> Struktur Organisasi</NavLink>
                    <NavLink to="/admin/privacy-policies" className={({ isActive }) => isActive ? 'active' : ''} onClick={() => setSidebarOpen(false)}><Shield size={18} /> Kebijakan Privasi</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn"><LogOut size={18} /> Keluar</button>
                </div>
            </aside>
            {sidebarOpen && <div className="sidebar-overlay visible" onClick={() => setSidebarOpen(false)} />}
            <main className="admin-content">
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <Outlet />
            </main>
        </div>
    );
}

export default function AdminLayout() {
    return (
        <ThemeProvider storageKey="admin-theme">
            <AdminLayoutInner />
        </ThemeProvider>
    );
}
