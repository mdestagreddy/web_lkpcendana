import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import AdminLayout from './pages/admin/AdminLayout';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const Home = lazy(() => import('./pages/public/Home'));
const Programs = lazy(() => import('./pages/public/Programs'));
const ProgramDetail = lazy(() => import('./pages/public/ProgramDetail'));
const Instructors = lazy(() => import('./pages/public/Instructors'));
const Gallery = lazy(() => import('./pages/public/Gallery'));
const Registration = lazy(() => import('./pages/public/Registration'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/public/PrivacyPolicy'));
const Posts = lazy(() => import('./pages/public/Posts'));
const PostDetail = lazy(() => import('./pages/public/PostDetail'));
const Reviews = lazy(() => import('./pages/public/Reviews'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPrograms = lazy(() => import('./pages/admin/AdminPrograms'));
const AdminInstructors = lazy(() => import('./pages/admin/AdminInstructors'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminInstitution = lazy(() => import('./pages/admin/AdminInstitution'));
const AdminVisionMission = lazy(() => import('./pages/admin/AdminVisionMission'));
const AdminSiteSettings = lazy(() => import('./pages/admin/AdminSiteSettings'));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrgChart = lazy(() => import('./pages/admin/AdminOrgChart'));
const AdminPrivacyPolicies = lazy(() => import('./pages/admin/AdminPrivacyPolicies'));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));

export default function App() {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <BrowserRouter>
                    <Suspense fallback={<LoadingSpinner text="Memuat halaman..." />}>
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
                    </Suspense>
                </BrowserRouter>
            </AuthProvider>
        </ErrorBoundary>
    );
}
