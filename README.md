# 💍 Aayojan — Wedding CRM & Operations Platform

> **The modern end-to-end CRM built for professional wedding planners.** Replace fragmented WhatsApp threads and Excel sheets with one beautifully crafted platform that manages your entire business — from first inquiry to final farewell.

---

## 📸 Screenshots

### Dashboard
<!-- Add your dashboard screenshot here -->
![Dashboard](./screenshots/dashboard.png)

### Weddings Overview
<!-- Add your weddings page screenshot here -->
![Weddings](./screenshots/weddings.png)

---

## 🎯 Objective

Aayojan (Hindi: *आयोजन* — "to organize, to plan") is designed for Indian wedding planners who manage dozens of simultaneous events across multiple teams, vendors, and clients. The platform addresses three core pain points:

1. **Scattered communication** — All leads, tasks, and vendor coordination live in one place instead of across WhatsApp groups and spreadsheets.
2. **No visibility into progress** — Real-time progress tracking per wedding, per event, and per task with a maker-checker approval workflow.
3. **Operational chaos** — Structured role-based access ensures team members see only what they need, managers can delegate effectively, and admins retain full oversight.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **Lead Pipeline** | Kanban-style drag-and-drop board (Inquiry → Proposal → Negotiation → Booked) with analytics |
| **Wedding Management** | Full wedding lifecycle with events, task checklists, vendor assignments, and a calendar |
| **Task System** | Category-based tasks with subtasks, vendor linking, priority levels, and maker-checker verification |
| **Budget Tracker** | Per-wedding financial overview with payment status (pending / partial / completed) |
| **Vendor Directory** | Searchable vendor database with ratings, categories, and task linking |
| **Mood Board** | Pinterest-style inspiration board with Pixabay image search integration |
| **Wedding Templates** | One-click creation of full weddings (Destination, Local, Luxury, Intimate) with pre-built events and tasks |
| **Hotel Search** | TripAdvisor-powered hotel search with direct event linking |
| **AI Assistant** | Groq-powered chatbot with live context of your weddings, tasks, and leads |
| **Notifications** | Real-time in-app notifications + automated vendor email/SMS reminders via Twilio & Nodemailer |
| **Role-Based Access** | Admin, Relationship Manager, Team Member, and Client roles with granular permissions |
| **Document Uploads** | Attach PDFs, images, and docs directly to tasks and events |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework with hooks-based architecture |
| **Vite 8** | Ultra-fast dev server and build tool |
| **TailwindCSS 4** | Utility-first CSS with a custom stone/warm color palette |
| **Zustand** | Lightweight, scalable state management (replaces Redux) |
| **React Router v7** | Client-side routing with protected and public routes |
| **@dnd-kit** | Accessible drag-and-drop for the Kanban lead pipeline |
| **Recharts** | Composable chart library for dashboard analytics |
| **Axios** | HTTP client with JWT interceptors and centralized error handling |
| **date-fns** | Lightweight date manipulation |
| **Lucide React** | Consistent, customizable icon set |
| **Groq SDK** | LLM inference for the AI chatbot (llama-3.1-8b-instant) |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express 4** | RESTful API server |
| **MongoDB + Mongoose 8** | Document database with rich schema validation |
| **JWT (jsonwebtoken)** | Stateless authentication with 7-day token expiry |
| **bcryptjs** | Password hashing with 12 salt rounds |
| **Multer** | Multipart file upload handling (docs, images, videos) |
| **node-cron** | Scheduled vendor notification jobs (runs every 30 min) |
| **Nodemailer** | SMTP-based email notifications to vendors |
| **Twilio** | SMS alerts to vendors for upcoming task deadlines |

---

## 📁 Project Structure

```
aayojan/
├── client/                         # React frontend (Vite)
│   ├── public/                     # Static assets (logo, images)
│   └── src/
│       ├── components/
│       │   ├── chat/               # AI chatbot + notification bell
│       │   ├── layout/             # Sidebar, TopNav, Footer, PageContainer
│       │   ├── shared/             # DocumentsDrawer
│       │   └── ui/                 # Toast notifications, ErrorBoundary
│       ├── hooks/                  # useWeddingPoller (AI nudge system)
│       ├── pages/                  # All page-level components
│       │   ├── Dashboard.jsx
│       │   ├── Weddings.jsx
│       │   ├── WeddingDetail.jsx
│       │   ├── Leads.jsx
│       │   ├── Tasks.jsx
│       │   ├── Vendors.jsx
│       │   ├── Budget.jsx
│       │   ├── Hotels.jsx
│       │   ├── Templates.jsx
│       │   ├── MoodBoard.jsx
│       │   ├── Profile.jsx
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Landing.jsx
│       ├── stores/                 # Zustand state stores
│       │   ├── authStore.js
│       │   ├── weddingStore.js
│       │   ├── leadStore.js
│       │   ├── taskStore.js
│       │   ├── vendorStore.js
│       │   ├── budgetStore.js
│       │   ├── dashboardStore.js
│       │   ├── chatStore.js
│       │   ├── notificationStore.js
│       │   └── toastStore.js
│       └── utils/
│           ├── api.js              # Axios instance with interceptors
│           ├── groq.js             # Groq LLM helper
│           └── helpers.js          # Date, currency, category utils
│
└── server/                         # Node.js backend (Express)
    ├── src/
    │   ├── controllers/            # Route handlers (business logic)
    │   ├── middleware/             # auth.js, errorHandler.js, upload.js
    │   ├── models/                 # Mongoose schemas
    │   │   ├── User.js
    │   │   ├── Wedding.js
    │   │   ├── Lead.js
    │   │   ├── Task.js
    │   │   ├── Vendor.js
    │   │   ├── Event.js
    │   │   ├── MoodBoard.js
    │   │   └── Notification.js
    │   ├── routes/                 # Express route definitions
    │   ├── data/                   # Static template data
    │   └── utils/
    │       ├── helpers.js          # JWT generation, progress calculation
    │       └── notificationScheduler.js  # Cron job for vendor reminders
    └── index.js                    # Server entry point
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **npm** v9 or higher

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/aayojan.git
cd aayojan
```

---

### 2. Set Up the Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/aayojan

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS — comma-separated list of allowed origins
CLIENT_URL=http://localhost:5173

# Email Notifications (optional — disables email if not set)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Notifications via Twilio (optional — disables SMS if not set)
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=+1xxxxxxxxxx

# Hotel Search — TripAdvisor via RapidAPI (optional)
RAPIDAPI_KEY=your-rapidapi-key

# Mood Board — Pixabay image search (optional)
PIXABAY_API=your-pixabay-api-key
```

Start the backend server with hot-reload:

```bash
npm run dev
```

The API will be available at **http://localhost:5000/api**

---

### 3. Set Up the Frontend

Open a new terminal tab:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Groq AI (for the chatbot assistant)
VITE_GROQ_API_KEY=your-groq-api-key
```

> **Get a free Groq API key** at [console.groq.com](https://console.groq.com) — the chatbot uses `llama-3.1-8b-instant` for fast, free inference.

Start the frontend dev server:

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

### 4. Summary — Running Both Servers

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

---

## 👤 User Roles & Permissions

| Permission | Admin | Relationship Manager | Team Member | Client |
|---|:---:|:---:|:---:|:---:|
| View Dashboard (global) | ✅ | ✅ | Personal only | Wedding only |
| Manage Leads | ✅ | ✅ (assigned) | View only | ❌ |
| Convert Lead → Wedding | ✅ | ✅ | ❌ | ❌ |
| Create / Edit Weddings | ✅ | ✅ | ❌ | ❌ |
| Create / Edit Tasks | ✅ | ✅ | ❌ | ❌ |
| Mark Tasks Done | ✅ | ✅ | ✅ (assigned) | ✅ |
| Verify Tasks | ✅ | ✅ | ❌ | ❌ |
| Manage Vendors | ✅ | ✅ | View only | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View Mood Board | ✅ | ✅ | ✅ | ✅ |
| Upload Documents | ✅ | ✅ | ❌ | ✅ |

---

## 🗺 API Overview

```
POST   /api/auth/register          Register a new user
POST   /api/auth/login             Login and receive JWT
GET    /api/auth/me                Get current user profile

GET    /api/leads                  List all leads
POST   /api/leads                  Create a lead
PUT    /api/leads/:id/stage        Drag-and-drop stage update
POST   /api/leads/:id/convert      Convert lead to wedding

GET    /api/weddings               List all weddings (with progress)
GET    /api/weddings/:id           Get wedding detail with tasks & events
POST   /api/weddings               Create a wedding
POST   /api/weddings/:id/team      Add team member
POST   /api/weddings/:id/vendors   Add vendor to wedding

GET    /api/tasks                  List tasks (filtered by role)
POST   /api/tasks                  Create a task
PUT    /api/tasks/:id/status       Update task status (done / verified)
PUT    /api/tasks/:id/subtasks/:subId  Toggle subtask completion

GET    /api/events/wedding/:id     Get events for a wedding
POST   /api/events                 Create a wedding event
POST   /api/events/:id/hotels      Link a hotel to an event

GET    /api/vendors                List vendors
POST   /api/vendors                Create a vendor

GET    /api/budget                 Get financial summary per wedding

POST   /api/templates/:type/convert  Convert a template into a full wedding

GET    /api/hotels/search          Search hotels via TripAdvisor

GET    /api/moodboard              Get mood board items
POST   /api/moodboard              Upload inspiration item
GET    /api/moodboard/pixabay      Search free images via Pixabay

GET    /api/dashboard/stats        Aggregated KPIs
GET    /api/dashboard/notifications  User notifications
```

---

## 🏗 Database Architecture

```
User ──────────────────────────────────────────────────────────┐
  │                                                             │
  ├── Lead (assignedTo, createdBy)                              │
  │     └── [activities[]]                                      │
  │     └── convertedToWedding ──► Wedding                      │
  │                                                             │
  └── Wedding (relationshipManager, assignedTeam[], clientId)   │
        ├── Event[] ────────────────────────────────────────────┤
        │     ├── assignedTeam[]                                 │
        │     ├── documents[]                                    │
        │     └── hotels[]                                       │
        │                                                        │
        ├── Task[] (wedding, event, assignedTo)                  │
        │     ├── subtasks[]                                     │
        │     ├── taskVendors[] ──► Vendor                       │
        │     └── documents[]                                    │
        │                                                        │
        ├── vendors[] ──► Vendor                                 │
        └── lead ──► Lead                                        │
                                                                 │
Notification (user ──────────────────────────────────────────── ┘)
MoodBoard (wedding, linkedEvents[], createdBy)
```

---

## 📦 Building for Production

```bash
# Build the frontend
cd client
npm run build
# Output: client/dist/

# Start the backend in production
cd server
NODE_ENV=production npm start
```

To serve the frontend from the same Express server, copy `client/dist` into the server root and add a static file route pointing to it.

---

## 🔧 Optional Integrations

| Integration | Env Variable(s) | Feature Unlocked |
|---|---|---|
| Groq (free) | `VITE_GROQ_API_KEY` | AI chatbot with pipeline context |
| Gmail SMTP | `SMTP_USER`, `SMTP_PASS` | Vendor task-due email reminders |
| Twilio | `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` | Vendor SMS alerts |
| RapidAPI (TripAdvisor) | `RAPIDAPI_KEY` | Hotel search for events |
| Pixabay | `PIXABAY_API` | Free image search for mood boards |

All integrations are **optional** — the core CRM works without any of them.

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">
  <p>Built with ❤️ for wedding planners who mean business.</p>
  <p><strong>Aayojan</strong> — Plan. Organize. Celebrate.</p>
</div>
