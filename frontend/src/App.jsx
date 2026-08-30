import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import Home from './pages/public/Home';
import Programs from './pages/public/Programs';
import ProgramDetail from './pages/public/ProgramDetail';
import Instructors from './pages/public/Instructors';
import Gallery from './pages/public/Gallery';
import Registration from './pages/public/Registration';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import Posts from './pages/public/Posts';
import PostDetail from './pages/public/PostDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPrograms from './pages/admin/AdminPrograms';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminTestimonials from './pages/admin/AdminTestimonials';
import AdminGallery from './pages/admin/AdminGallery';
import AdminUsers from './pages/admin/AdminUsers';
import AdminInstitution from './pages/admin/AdminInstitution';
import AdminVisionMission from './pages/admin/AdminVisionMission';
import AdminSiteSettings from './pages/admin/AdminSiteSettings';
import AdminPosts from './pages/admin/AdminPosts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrgChart from './pages/admin/AdminOrgChart';
import AdminPrivacyPolicies from './pages/admin/AdminPrivacyPolicies';
import AdminSecurity from './pages/admin/AdminSecurity';
import AdminLogin from './pages/admin/AdminLogin';
import Reviews from './pages/public/Reviews';
import AdminReviews from './pages/admin/AdminReviews';
import './App.css';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Home />} />
                            <Route path="programs" element={<Programs />} />
                            <Route path="programs/:id" element={<ProgramDetail />} />
                            <Route path="instructors" element={<Instructors />} />
                            <Route path="gallery" element={<Gallery />} />
                            <Route path="registration" element={<Registration />} />
                            <Route path="about" element={<About />} />
                            <Route path="contact" element={<Contact />} />
                            <Route path="privacy-policy" element={<PrivacyPolicy />} />
                            <Route path="posts" element={<Posts />} />
                            <Route path="posts/:id" element={<PostDetail />} />
                            <Route path="reviews" element={<Reviews />} />
                        </Route>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="programs" element={<AdminPrograms />} />
                            <Route path="instructors" element={<AdminInstructors />} />
                            <Route path="testimonials" element={<AdminTestimonials />} />
                            <Route path="reviews" element={<AdminReviews />} />
                            <Route path="gallery" element={<AdminGallery />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="institution" element={<AdminInstitution />} />
                            <Route path="vision-mission" element={<AdminVisionMission />} />
                            <Route path="site-settings" element={<AdminSiteSettings />} />
                            <Route path="posts" element={<AdminPosts />} />
                            <Route path="categories" element={<AdminCategories />} />
                            <Route path="org-chart" element={<AdminOrgChart />} />
                            <Route path="privacy-policies" element={<AdminPrivacyPolicies />} />
                            <Route path="security" element={<AdminSecurity />} />
                        </Route>
                        <Route path="/admin/login" element={<AdminLogin />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        );
}
