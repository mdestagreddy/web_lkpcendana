const API_BASE_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';

export { API_BASE_URL };

let isRedirecting = false;

async function request(path, options = {}) {
    const url = `${API_BASE_URL}/api${path}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    if (options.isAdmin) {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        delete config.isAdmin;
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (response.status === 401 && options.isAdmin) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');

        if (!isRedirecting) {
            isRedirecting = true;
            window.location.href = '/admin/login';
        }

        return;
    }

    if (!response.ok) {
        const error = new Error(data.error || 'Permintaan gagal');
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
}

export const publicApi = {
    login: (credentials) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }),

    uploadImage: (formData) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        const url = `${API_BASE_URL}/upload/upload`;

        return fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        }).then(res => {
            if (!res.ok) {
                return res.json().then(data => {
                    const error = new Error(data.error || 'Upload failed');
                    error.status = res.status;
                    error.data = data;
                    throw error;
                });
            }
            return res.json();
        });
    },

    getPrograms: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/programs${qs ? `?${qs}` : ''}`);
    },

    getProgram: (id) => request(`/public/programs/${id}`),

    getProgramModules: (id) => request(`/public/programs/${id}/modules`),

    getFeaturedPrograms: () => request('/public/programs/featured'),

    getInstructors: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/instructors${qs ? `?${qs}` : ''}`);
    },

    getInstructor: (id) => request(`/public/instructors/${id}`),

    getTestimonials: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/testimonials${qs ? `?${qs}` : ''}`);
    },

    getGallery: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/gallery${qs ? `?${qs}` : ''}`);
    },

    getInstitution: () => request('/public/institution'),

    getVisionMission: () => request('/public/vision-mission'),

    getSiteSettings: () => request('/public/site-settings'),

    getPosts: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/posts${qs ? `?${qs}` : ''}`);
    },

    getPost: (id) => request(`/public/posts/${id}`),

    getCategories: () => request('/public/categories'),

    getOrgChart: () => request('/public/org-chart'),

    getPrivacyPolicy: () => request('/public/privacy-policy'),

    getCaptcha: () => request('/public/reviews/captcha'),

    getLoginCaptcha: () => request('/auth/captcha'),

    logout: () => request('/auth/logout', { method: 'POST' }),

    getReviews: (params = {}) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                query.append(key, value);
            }
        });
        const qs = query.toString();
        return request(`/public/reviews${qs ? `?${qs}` : ''}`);
    },

    createReview: (data) => {
        const url = `${API_BASE_URL}/api/public/reviews`;
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(async res => {
            const result = await res.json();
            if (!res.ok) {
                const error = new Error(result.error || 'Gagal mengirim ulasan');
                error.status = res.status;
                error.data = result;
                throw error;
            }
            return result;
        });
    },
};

export const adminApi = {
    programs: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/programs${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/programs', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/programs/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/programs/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    programModules: {
        list: (programId) => request(`/admin/programs/${programId}/modules`, { isAdmin: true }),
        create: (programId, data) => request(`/admin/programs/${programId}/modules`, {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (programId, moduleId, data) => request(`/admin/programs/${programId}/modules/${moduleId}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (programId, moduleId) => request(`/admin/programs/${programId}/modules/${moduleId}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    instructors: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/instructors${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/instructors', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/instructors/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/instructors/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    testimonials: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/testimonials${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/testimonials', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/testimonials/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/testimonials/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    gallery: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/gallery${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/gallery', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/gallery/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/gallery/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    users: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/users${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/users', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/users/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/users/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    institutionInfo: {
        list: () => request('/admin/institution-info', { isAdmin: true }),
        update: (key, data) => request(`/admin/institution-info/${key}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
    },

    visionMission: {
        list: () => request('/admin/vision-mission', { isAdmin: true }),
        create: (data) => request('/admin/vision-mission', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/vision-mission/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/vision-mission/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    siteSettings: {
        list: () => request('/admin/site-settings', { isAdmin: true }),
        update: (key, data) => request(`/admin/site-settings/${key}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
    },

    posts: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/posts${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/posts', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/posts/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/posts/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    categories: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/categories${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/categories', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/categories/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/categories/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    orgChart: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/org-chart${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/org-chart', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/org-chart/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/org-chart/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    privacyPolicies: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/privacy-policies${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/privacy-policies', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/privacy-policies/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/privacy-policies/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },

    reviews: {
        list: (params = {}) => {
            const query = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    query.append(key, value);
                }
            });
            const qs = query.toString();
            return request(`/admin/reviews${qs ? `?${qs}` : ''}`, { isAdmin: true });
        },
        create: (data) => request('/admin/reviews', {
            method: 'POST',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        update: (id, data) => request(`/admin/reviews/${id}`, {
            method: 'PUT',
            isAdmin: true,
            body: JSON.stringify(data),
        }),
        delete: (id) => request(`/admin/reviews/${id}`, {
            method: 'DELETE',
            isAdmin: true,
        }),
    },
};
