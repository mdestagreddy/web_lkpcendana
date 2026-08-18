# Web LKP Cendana

Web resmi LKP Cendana - website publik dan panel admin untuk manajemen konten institusi pendidikan.

## Tech Stack

- **Frontend**: React 19 + Vite + React Router DOM
- **Backend**: Express 5 + MySQL2 + JWT + Multer + Sharp
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
│   │   │   └── upload.js
│   │   └── routes/
│   │       ├── public.js
│   │       ├── admin.js
│   │       ├── auth.js
│   │       └── upload.js
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
│   │   │   └── CustomCheckbox.jsx
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
│   │   │   │   └── PrivacyPolicy.jsx
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
│   │   │       └── AdminOrgChart.jsx
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
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=3306
DB_USER=[INSERT USERNAME HERE]
DB_PASS=[INSERT PASSWORD HERE]
DB_SCHEME=[INSERT DATABASE SCHEME HERE]

SERVER_PORT=[INSERT PORT HERE]
ADMIN_API_KEY=[INSERT KEY HERE]
JWT_SECRET=[INSERT SECRET KEY HERE]
```

### Frontend (`frontend/.env`)

```env
VITE_BACKEND=http://localhost:5000/api
```

## Database Setup

Jalankan script setup database:

```bash
cd backend
npm run setup-db
```

Script ini akan membuat tabel-tabel yang dibutuhkan berdasarkan `src/database/setup.sql` dan `src/database/add.sql`.

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

## API Routes

- `/api/public` - Routes publik (homepage, gallery, posts, dll.)
- `/api/auth` - Authentication (login, register, forgot password)
- `/api/admin` - Admin routes (CRUD programs, gallery, users, posts, dll.)
- `/api/upload` - Upload file (gambar)
- `/uploads` - Static file serving

## Features

- Publik: Home, About, Programs, Gallery, Instructors, Posts, Contact, Registration, Privacy Policy
- Admin: Dashboard, Site Settings, Programs, Gallery, Instructors, Institution, Users, Posts, Categories, Testimonials, Privacy Policies, Vision & Mission, Organization Chart
- Image upload with thumbnail generation (Sharp)
- JWT-based authentication
- Role-based access control (admin)
