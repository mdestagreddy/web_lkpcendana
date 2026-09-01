# Web LKP Cendana

Web resmi LKP Cendana - website publik dan panel admin untuk manajemen konten institusi pendidikan.

## Tech Stack

- **Frontend**: React 19 + Vite + React Router DOM + Tiptap + CodeMirror + Lucide React
- **Backend**: Express 5 + MySQL2 + JWT + Multer + Sharp + Cloudinary + Midtrans + bcrypt + otplib + svg-captcha
- **Package Manager**: npm (CommonJS + ESM hybrid)

## Project Structure

```
web_lkpcendana/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── setup_database.js
│   │   ├── database/
│   │   │   ├── db.js
│   │   │   ├── setup.sql
│   │   │   └── add.sql
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   ├── tokenBlacklist.js
│   │   │   ├── rateLimit.js
│   │   │   └── honeypot.js
│   │   ├── utils/
│   │   │   └── captcha.js
│   │   └── routes/
│   │       ├── public.js
│   │       ├── admin.js
│   │       ├── auth.js
│   │       ├── upload.js
│   │       ├── payment.js
│   │       ├── admin-payments.js
│   │       ├── reviews.js
│   │       └── admin-reviews.js
│   ├── uploads/
│   ├── index.js
│   ├── package.json
│   ├── .env.example
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── scrollview/
│   │   │   ├── Footer.jsx
│   │   │   ├── Image.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── HTMLEditor.jsx
│   │   │   ├── TextEditor.jsx
│   │   │   ├── CustomColorPicker.jsx
│   │   │   ├── CustomCheckbox.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ImageLightbox.jsx
│   │   │   ├── MultiImageUpload.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── SecurityCaptcha.jsx
│   │   │   ├── Verify2FA.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── useAuth.js
│   │   │   ├── ThemeContext.jsx
│   │   │   └── useTheme.js
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── Home.jsx
│   │   │   │   ├── About.jsx
│   │   │   │   ├── Programs.jsx
│   │   │   │   ├── ProgramDetail.jsx
│   │   │   │   ├── Gallery.jsx
│   │   │   │   ├── Instructors.jsx
│   │   │   │   ├── Posts.jsx
│   │   │   │   ├── PostDetail.jsx
│   │   │   │   ├── Contact.jsx
│   │   │   │   ├── Registration.jsx
│   │   │   │   ├── PrivacyPolicy.jsx
│   │   │   │   └── Reviews.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminSiteSettings.jsx
│   │   │       ├── AdminPrograms.jsx
│   │   │       ├── AdminGallery.jsx
│   │   │       ├── AdminInstructors.jsx
│   │   │       ├── AdminInstitution.jsx
│   │   │       ├── AdminUsers.jsx
│   │   │       ├── AdminPosts.jsx
│   │   │       ├── AdminCategories.jsx
│   │   │       ├── AdminTestimonials.jsx
│   │   │       ├── AdminPrivacyPolicies.jsx
│   │   │       ├── AdminVisionMission.jsx
│   │   │       ├── AdminOrgChart.jsx
│   │   │       ├── AdminSecurity.jsx
│   │   │       ├── AdminReviews.jsx
│   │   │       └── AdminPayments.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── .env.example
│   ├── .env
│   ├── .oxlintrc.json
│   ├── package.json
│   └── package-lock.json
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js >= 18.x
- MySQL >= 5.7 / MariaDB >= 10.x
- npm

## Installation

1. Clone repository
2. Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Environment Variables

### Backend (`backend/.env`)

```env
# Cloudinary Configuration (untuk server luar)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=lkpcendana

# Frontend URL (digunakan untuk CORS)
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_SCHEME=db_server
DB_SSL_REQUIRED=false
DB_SSL_CA_PATH=./ca-cert.pem

# Server Configuration
SERVER_PORT=5000

# Security
ADMIN_API_KEY=your_admin_api_key_here
JWT_SECRET=your_jwt_secret_here
CAPTCHA_SECRET=your_captcha_secret_here

# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_MERCHANT_ID=your_merchant_id
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND=http://localhost:5000
VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

## Database Setup

Jalankan script setup database:

```bash
cd backend
npm run setup-db
```

Script ini akan membuat tabel-tabel yang dibutuhkan berdasarkan `src/database/setup.sql` dan `src/database/add.sql`.

Untuk menjalankan skrip tambahan:

```bash
npm run add-sql
```

## Running the Application

### Run Both Frontend & Backend (Development)

```bash
npm run dev
```

### Run Separately

```bash
# Backend (port 5000)
npm run server

# Frontend (port 5173)
npm run client
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
cd frontend && npm run preview
```

### Lint

```bash
cd frontend && npm run lint
```

## API Routes

- `/api/public` - Routes publik (homepage, gallery, posts, dll.)
- `/api/auth` - Authentication (login, register, forgot password, 2FA)
- `/api/admin` - Admin routes (CRUD programs, gallery, users, posts, dll.)
- `/api/upload` - Upload file (gambar)
- `/api/payment` - Payment routes (create transaction, notification, status)
- `/api/admin/payments` - Admin payment management
- `/api/reviews` - Reviews publik
- `/api/admin/reviews` - Admin reviews
- `/uploads` - Static file serving

## Features

- Publik: Home, About, Programs, Gallery, Instructors, Posts, Contact, Registration, Privacy Policy, Reviews
- Admin: Dashboard, Site Settings, Programs, Gallery, Instructors, Institution, Users, Posts, Categories, Testimonials, Privacy Policies, Vision & Mission, Organization Chart, Security, Reviews, Payments
- Image upload with thumbnail generation (Sharp) and Cloudinary integration
- JWT-based authentication with token blacklist
- Two-factor authentication (2FA) with otplib
- CAPTCHA protection (svg-captcha)
- Rate limiting and honeypot security middleware
- Rich text editor (Tiptap) and code editor (CodeMirror)
- Image lightbox and multi-image upload
- Role-based access control (admin)
- Error boundary for React
- Oxlint for code quality
- Midtrans payment integration with Snap JS
- Program pricing and payment tracking
