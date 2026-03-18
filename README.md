# Wedding CRM - End-to-End Operations Platform

A modern, full-stack CRM system designed for professional wedding planners to manage leads, weddings, tasks, vendors, and teams.

## Features

### Core Features
- **Lead Pipeline**: Kanban-style drag-and-drop lead management with stages (Inquiry → Proposal → Negotiation → Booked)
- **Wedding Management**: Comprehensive wedding dashboard with progress tracking, team assignment, and vendor management
- **Task System**: Category-based task management with maker-checker workflow (F&B, Decor, Logistics, AV, etc.)
- **Vendor Directory**: Complete vendor management with categories, ratings, and price ranges
- **Dashboard Analytics**: Real-time statistics, charts, and activity feeds

### Technical Features
- JWT-based authentication with role-based access control
- Three user roles: Admin, Relationship Manager, Team Member
- Modern glassmorphic UI with dark theme
- Responsive design (desktop-first)
- RESTful API architecture

## Project Structure

```
weddingCRM/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Sidebar, Topbar, Layout
│   │   │   └── ui/         # Button, Card, Modal, etc.
│   │   ├── context/        # Auth context
│   │   ├── pages/          # Page components
│   │   ├── utils/          # API client, helpers
│   │   └── App.jsx         # Main app with routing
│   └── package.json
│
└── server/                 # Node.js backend (Express)
    ├── controllers/        # Route handlers
    ├── middleware/         # Auth, error handling
    ├── models/             # Mongoose schemas
    ├── routes/             # API routes
    ├── utils/              # Helper functions
    └── index.js            # Server entry point
```

## Tech Stack

**Frontend:**
- React 18 + Vite
- TailwindCSS
- React Router v6
- @dnd-kit (drag-and-drop)
- Recharts (charts)
- Lucide React (icons)
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

## Getting Started

### 1. Clone and Setup

```bash
cd weddingCRM
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create `.env` file (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wedding-crm
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

Start MongoDB:
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

Start the server:
```bash
npm run dev
```

### 3. Setup Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, user management, verify tasks |
| **Relationship Manager** | Manage leads, weddings, tasks, vendors |
| **Team Member** | View assigned items, update task status |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List all users

### Leads
- `GET /api/leads` - List leads
- `GET /api/leads/pipeline` - Get leads grouped by stage
- `POST /api/leads` - Create lead
- `PUT /api/leads/:id` - Update lead
- `PUT /api/leads/:id/stage` - Update lead stage
- `POST /api/leads/:id/convert` - Convert lead to wedding

### Weddings
- `GET /api/weddings` - List weddings
- `GET /api/weddings/:id` - Get wedding details
- `POST /api/weddings` - Create wedding
- `PUT /api/weddings/:id` - Update wedding
- `POST /api/weddings/:id/team` - Add team member
- `POST /api/weddings/:id/vendors` - Add vendor

### Tasks
- `GET /api/tasks` - List tasks
- `GET /api/tasks/wedding/:id` - Get tasks by wedding
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id/status` - Update task status

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/notifications` - Get notifications

## UI Features

- Modern glassmorphic design
- Dark theme optimized for long usage
- Responsive layout
- Smooth animations and transitions
- Interactive Kanban board for leads
- Progress indicators for weddings
- Category-based task grouping

## Default Test Credentials

After registering your first user, they'll be assigned the role specified during registration. The first admin user can then manage other users' roles.

## Development

### Running in Development

Backend (with auto-reload):
```bash
cd server && npm run dev
```

Frontend (with HMR):
```bash
cd client && npm run dev
```

### Building for Production

```bash
# Build frontend
cd client && npm run build

# The built files will be in client/dist
```

## License

MIT License
