# Wedding CRM - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Database Architecture](#database-architecture)
4. [API Routes & Endpoints](#api-routes--endpoints)
5. [Frontend Pages & Components](#frontend-pages--components)
6. [Data Flow & Connections](#data-flow--connections)
7. [Feature Workflows](#feature-workflows)

---

## System Overview

The Wedding CRM is a full-stack application designed to help wedding planners manage their entire workflow - from initial client inquiry to wedding execution. It replaces manual WhatsApp + Excel workflows with a unified digital platform.

### Architecture
```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐     Mongoose     ┌─────────────────┐
│                 │  ◄──────────────►  │                 │  ◄────────────►  │                 │
│  React Frontend │                    │  Express Server │                  │    MongoDB      │
│  (Port 5173)    │                    │  (Port 5000)    │                  │                 │
└─────────────────┘                    └─────────────────┘                  └─────────────────┘
```

---

## User Roles & Permissions

### 1. Admin
The highest privilege level with full system access.

| Feature | Permissions |
|---------|-------------|
| **Users** | Create, view, edit roles, activate/deactivate users |
| **Leads** | Create, view, edit, delete, convert to wedding, assign to anyone |
| **Weddings** | Create, view, edit, delete, manage team, manage vendors |
| **Tasks** | Create, view, edit, delete, mark done, **verify tasks** |
| **Vendors** | Create, view, edit, delete |
| **Dashboard** | View all statistics (global view) |
| **Settings** | Access settings page, manage all users |

### 2. Relationship Manager
Mid-level access for managing client relationships.

| Feature | Permissions |
|---------|-------------|
| **Users** | View all users |
| **Leads** | Create, view, edit, delete, convert to wedding, assign to team members |
| **Weddings** | Create, view, edit, delete, manage team, manage vendors |
| **Tasks** | Create, view, edit, delete, mark done, **verify tasks** |
| **Vendors** | Create, view, edit, delete |
| **Dashboard** | View all statistics (global view) |
| **Settings** | No access |

### 3. Team Member
Limited access for execution-level staff.

| Feature | Permissions |
|---------|-------------|
| **Users** | View all users |
| **Leads** | View only assigned leads, add activities |
| **Weddings** | View only weddings where assigned to team |
| **Tasks** | View assigned tasks, mark as done (cannot verify) |
| **Vendors** | View only |
| **Dashboard** | View personal statistics only |
| **Settings** | No access |

### Permission Matrix

```
Feature              │ Admin │ Manager │ Team Member
─────────────────────┼───────┼─────────┼─────────────
Create Lead          │  ✓    │    ✓    │     ✓
Delete Lead          │  ✓    │    ✓    │     ✗
Convert Lead         │  ✓    │    ✓    │     ✗
Create Wedding       │  ✓    │    ✓    │     ✗
Delete Wedding       │  ✓    │    ✓    │     ✗
Create Task          │  ✓    │    ✓    │     ✓
Delete Task          │  ✓    │    ✓    │     ✗
Verify Task          │  ✓    │    ✓    │     ✗
Create Vendor        │  ✓    │    ✓    │     ✗
Delete Vendor        │  ✓    │    ✓    │     ✗
Manage Users         │  ✓    │    ✗    │     ✗
View All Data        │  ✓    │    ✓    │     ✗
```

---

## Database Architecture

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    USER      │       │    LEAD      │       │   WEDDING    │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ _id          │◄──────│ assignedTo   │       │ _id          │
│ name         │       │ createdBy    │──────►│ lead         │
│ email        │◄──────│ _id          │       │ relationMgr  │──┐
│ password     │       │ name         │       │ assignedTeam │──┤
│ role         │       │ phone        │       │ vendors[]    │  │
│ phone        │       │ email        │       │ createdBy    │──┤
│ isActive     │       │ stage        │       └──────────────┘  │
└──────────────┘       │ source       │              │          │
       │               │ activities[] │              │          │
       │               └──────────────┘              │          │
       │                                             ▼          │
       │               ┌──────────────┐       ┌──────────────┐  │
       │               │    TASK      │       │   VENDOR     │  │
       │               ├──────────────┤       ├──────────────┤  │
       └──────────────►│ assignedTo   │       │ _id          │◄─┘
                       │ wedding      │──────►│ name         │
                       │ createdBy    │       │ category     │
                       │ completedBy  │       │ contact      │
                       │ verifiedBy   │       │ rating       │
                       │ category     │       │ priceRange   │
                       │ status       │       └──────────────┘
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ NOTIFICATION │
                       ├──────────────┤
                       │ user         │
                       │ type         │
                       │ title        │
                       │ relatedTo    │
                       └──────────────┘
```

### Collection Schemas

#### 1. Users Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: Enum ['admin', 'relationship_manager', 'team_member'],
  phone: String,
  avatar: String,
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. Leads Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String,
  phone: String (required),
  source: Enum ['referral', 'website', 'social_media', 'advertisement', 'walk_in', 'other'],
  stage: Enum ['inquiry', 'proposal', 'negotiation', 'booked', 'lost'],
  estimatedBudget: Number,
  weddingDate: Date,
  venue: String,
  guestCount: Number,
  notes: String,
  assignedTo: ObjectId (ref: User),
  followUpDate: Date,
  activities: [{
    type: Enum ['note', 'call', 'email', 'meeting', 'status_change', 'assignment'],
    description: String,
    createdBy: ObjectId (ref: User),
    createdAt: Date
  }],
  convertedToWedding: ObjectId (ref: Wedding),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. Weddings Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  clientName: String (required),
  clientEmail: String,
  clientPhone: String,
  weddingDate: Date (required),
  endDate: Date,
  venue: {
    name: String,
    address: String,
    city: String
  },
  guestCount: Number,
  budget: {
    estimated: Number,
    spent: Number
  },
  status: Enum ['planning', 'in_progress', 'completed', 'cancelled'],
  assignedTeam: [{
    user: ObjectId (ref: User),
    role: String
  }],
  relationshipManager: ObjectId (ref: User),
  vendors: [{
    vendor: ObjectId (ref: Vendor),
    category: String,
    confirmed: Boolean,
    amount: Number,
    notes: String
  }],
  notes: String,
  lead: ObjectId (ref: Lead),
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. Tasks Collection
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  category: Enum ['fnb', 'decor', 'logistics', 'av', 'photography', 'entertainment', 'attire', 'other'],
  status: Enum ['pending', 'done', 'not_needed', 'verified'],
  priority: Enum ['low', 'medium', 'high', 'urgent'],
  wedding: ObjectId (ref: Wedding, required),
  assignedTo: ObjectId (ref: User),
  dueDate: Date,
  completedAt: Date,
  completedBy: ObjectId (ref: User),
  verifiedAt: Date,
  verifiedBy: ObjectId (ref: User),
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. Vendors Collection
```javascript
{
  _id: ObjectId,
  name: String (required),
  category: Enum ['catering', 'decor', 'photography', 'videography', 'music', 'makeup', 'venue', 'transport', 'invitation', 'other'],
  contactPerson: String,
  email: String,
  phone: String,
  address: String,
  city: String,
  rating: Number (1-5),
  priceRange: Enum ['budget', 'moderate', 'premium', 'luxury'],
  notes: String,
  isActive: Boolean,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. Notifications Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, required),
  type: Enum ['task_assigned', 'task_due', 'lead_assigned', 'wedding_update', 'general'],
  title: String (required),
  message: String,
  link: String,
  read: Boolean (default: false),
  relatedTo: {
    model: Enum ['Lead', 'Wedding', 'Task', 'Vendor'],
    id: ObjectId
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Routes & Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/register` | Create new user account | No | - |
| POST | `/login` | Login and get JWT token | No | - |
| GET | `/me` | Get current user profile | Yes | Any |
| PUT | `/profile` | Update own profile | Yes | Any |
| PUT | `/password` | Change password | Yes | Any |
| GET | `/users` | List all users | Yes | Any |
| PUT | `/users/:id` | Update user role/status | Yes | Admin |

**Request/Response Examples:**

```javascript
// POST /api/auth/register
Request: {
  name: "John Doe",
  email: "john@example.com",
  password: "password123",
  role: "team_member",
  phone: "+91 9876543210"
}
Response: {
  user: { _id, name, email, role, ... },
  token: "eyJhbGciOiJIUzI1NiIs..."
}

// POST /api/auth/login
Request: {
  email: "john@example.com",
  password: "password123"
}
Response: {
  user: { _id, name, email, role, ... },
  token: "eyJhbGciOiJIUzI1NiIs..."
}
```

### Lead Routes (`/api/leads`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/` | List all leads | Yes | Any (filtered for team members) |
| GET | `/pipeline` | Get leads grouped by stage | Yes | Any |
| GET | `/:id` | Get single lead details | Yes | Any |
| POST | `/` | Create new lead | Yes | Any |
| PUT | `/:id` | Update lead | Yes | Any |
| PUT | `/:id/stage` | Update lead stage (drag-drop) | Yes | Any |
| POST | `/:id/activity` | Add activity to lead | Yes | Any |
| POST | `/:id/convert` | Convert lead to wedding | Yes | Admin/Manager |
| DELETE | `/:id` | Delete lead | Yes | Admin/Manager |

**Request/Response Examples:**

```javascript
// POST /api/leads
Request: {
  name: "Priya Sharma",
  phone: "+91 9876543210",
  email: "priya@example.com",
  source: "referral",
  estimatedBudget: 5000000,
  weddingDate: "2026-12-15",
  venue: "Taj Palace",
  guestCount: 500,
  assignedTo: "userId123"
}

// PUT /api/leads/:id/stage
Request: {
  stage: "proposal"
}

// POST /api/leads/:id/convert
Request: {
  name: "Sharma-Gupta Wedding",
  weddingDate: "2026-12-15"
}
Response: {
  wedding: { /* new wedding object */ },
  lead: { /* updated lead with convertedToWedding */ }
}
```

### Wedding Routes (`/api/weddings`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/` | List all weddings | Yes | Any (filtered for team members) |
| GET | `/upcoming` | Get weddings in next 30 days | Yes | Any |
| GET | `/:id` | Get wedding with tasks | Yes | Any |
| POST | `/` | Create new wedding | Yes | Admin/Manager |
| PUT | `/:id` | Update wedding | Yes | Admin/Manager |
| DELETE | `/:id` | Delete wedding (and tasks) | Yes | Admin/Manager |
| POST | `/:id/team` | Add team member | Yes | Admin/Manager |
| DELETE | `/:id/team/:userId` | Remove team member | Yes | Admin/Manager |
| POST | `/:id/vendors` | Add vendor to wedding | Yes | Admin/Manager |
| DELETE | `/:id/vendors/:vendorId` | Remove vendor | Yes | Admin/Manager |

**Request/Response Examples:**

```javascript
// POST /api/weddings
Request: {
  name: "Sharma-Gupta Wedding",
  clientName: "Priya Sharma",
  clientEmail: "priya@example.com",
  clientPhone: "+91 9876543210",
  weddingDate: "2026-12-15",
  venue: {
    name: "Taj Palace",
    address: "123 Main Road",
    city: "Delhi"
  },
  guestCount: 500,
  budget: { estimated: 5000000 },
  relationshipManager: "userId123"
}

// POST /api/weddings/:id/team
Request: {
  userId: "teamMemberId",
  role: "Decor Coordinator"
}

// POST /api/weddings/:id/vendors
Request: {
  vendorId: "vendorId123",
  category: "catering",
  amount: 500000,
  notes: "Confirmed for 500 pax"
}
```

### Task Routes (`/api/tasks`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/` | List all tasks | Yes | Any (filtered for team members) |
| GET | `/my-tasks` | Get current user's tasks | Yes | Any |
| GET | `/overdue` | Get overdue tasks | Yes | Any |
| GET | `/wedding/:weddingId` | Get tasks by wedding | Yes | Any |
| GET | `/:id` | Get single task | Yes | Any |
| POST | `/` | Create task | Yes | Any |
| POST | `/bulk` | Create multiple tasks | Yes | Admin/Manager |
| PUT | `/:id` | Update task | Yes | Any |
| PUT | `/:id/status` | Change task status | Yes | Any (verify needs Admin/Manager) |
| DELETE | `/:id` | Delete task | Yes | Admin/Manager |

**Task Status Flow:**
```
pending ──► done ──► verified
    │         │
    └─────────┴──► not_needed
```

**Request/Response Examples:**

```javascript
// POST /api/tasks
Request: {
  title: "Confirm catering menu",
  description: "Finalize menu with 3 options",
  category: "fnb",
  priority: "high",
  wedding: "weddingId123",
  assignedTo: "userId456",
  dueDate: "2026-11-01"
}

// PUT /api/tasks/:id/status
Request: {
  status: "done"  // Team member marks done
}
// Then admin/manager can:
Request: {
  status: "verified"  // Maker-checker approval
}
```

### Vendor Routes (`/api/vendors`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/` | List all vendors | Yes | Any |
| GET | `/by-category` | Get vendors grouped by category | Yes | Any |
| GET | `/:id` | Get single vendor | Yes | Any |
| POST | `/` | Create vendor | Yes | Admin/Manager |
| PUT | `/:id` | Update vendor | Yes | Admin/Manager |
| DELETE | `/:id` | Soft delete (deactivate) | Yes | Admin/Manager |

**Request/Response Examples:**

```javascript
// POST /api/vendors
Request: {
  name: "Royal Caterers",
  category: "catering",
  contactPerson: "Rajesh Kumar",
  email: "royal@example.com",
  phone: "+91 9876543210",
  address: "456 Food Street",
  city: "Delhi",
  rating: 4,
  priceRange: "premium"
}
```

### Dashboard Routes (`/api/dashboard`)

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/stats` | Get aggregated statistics | Yes | Any |
| GET | `/activity` | Get recent activity | Yes | Any |
| GET | `/monthly` | Get monthly trends | Yes | Any |
| GET | `/notifications` | Get user notifications | Yes | Any |
| PUT | `/notifications/:id/read` | Mark notification read | Yes | Any |
| PUT | `/notifications/read-all` | Mark all as read | Yes | Any |

**Response Examples:**

```javascript
// GET /api/dashboard/stats
Response: {
  stats: {
    totalLeads: 45,
    activeWeddings: 12,
    pendingTasks: 87,
    overdueTasks: 5,
    newLeadsThisMonth: 8,
    conversions: 3,
    conversionRate: 27,
    leadsByStage: {
      inquiry: 15,
      proposal: 12,
      negotiation: 8,
      booked: 10
    }
  }
}

// GET /api/dashboard/activity
Response: {
  recentLeads: [...],
  recentWeddings: [...],
  upcomingTasks: [...]
}
```

---

## Frontend Pages & Components

### Page Structure

```
App.jsx
├── /login          → Login.jsx (public)
├── /register       → Register.jsx (public)
└── Layout.jsx (protected, includes Sidebar + Topbar)
    ├── /              → Dashboard.jsx
    ├── /leads         → Leads.jsx (Kanban board)
    ├── /weddings      → Weddings.jsx (grid view)
    ├── /weddings/:id  → WeddingDetail.jsx
    ├── /tasks         → Tasks.jsx (list view)
    ├── /vendors       → Vendors.jsx (grid view)
    └── /settings      → Settings.jsx (admin only)
```

### Component Hierarchy

```
Layout
├── Sidebar
│   ├── Logo
│   ├── Navigation Links
│   └── Collapse Button
├── Topbar
│   ├── Search Bar
│   ├── Notifications Bell
│   └── User Menu (Avatar + Dropdown)
└── Main Content (Outlet)
    └── [Page Component]

UI Components (shared)
├── Button (primary, secondary, ghost, danger, success)
├── Card (CardHeader, CardContent, CardTitle)
├── Input (Input, Select, Textarea)
├── Modal (dialog with overlay)
├── Badge (status indicators)
├── Avatar (user initials or image)
├── Loader (PageLoader, inline)
└── EmptyState (no data placeholder)
```

### Page Functionalities

#### 1. Dashboard (`/`)
- **Stats Cards**: Total leads, active weddings, pending tasks, conversion rate
- **Lead Trends Chart**: Area chart showing leads & conversions over 6 months
- **Pipeline Overview**: Lead count by stage
- **Recent Leads**: Last 5 leads with quick status
- **Upcoming Tasks**: Next 5 due tasks
- **Upcoming Weddings**: Weddings in next 30 days

#### 2. Leads (`/leads`)
- **Kanban Board**: 4 columns (Inquiry, Proposal, Negotiation, Booked)
- **Drag & Drop**: Move leads between stages
- **Lead Cards**: Name, phone, budget, date, assigned person
- **Add Lead Modal**: Full form for new lead
- **Edit Lead**: Click card to edit
- **Convert to Wedding**: Button in edit modal (Admin/Manager only)

#### 3. Weddings (`/weddings`)
- **Filter Tabs**: All, Planning, In Progress, Completed
- **Wedding Cards**: Name, client, date, venue, budget, progress bar
- **Days Counter**: Shows days until wedding
- **Add/Edit Modal**: Full wedding form
- **Click to View**: Navigate to detail page

#### 4. Wedding Detail (`/weddings/:id`)
- **Header Section**: Name, client, days countdown
- **Info Cards**: Date, venue, guests, budget
- **Progress Bar**: Based on completed tasks
- **Task Checklist**: Grouped by category (F&B, Decor, etc.)
  - Expandable sections
  - Status toggle (pending → done → verified)
  - Overdue highlighting
  - Quick edit button
- **Sidebar - Team**: Relationship manager + assigned team
- **Sidebar - Vendors**: Assigned vendors with amounts
- **Add Task Modal**: Title, category, priority, assignee, due date
- **Add Team Modal**: Select user + role
- **Add Vendor Modal**: Select vendor + amount

#### 5. Tasks (`/tasks`)
- **Stats Cards**: Total, pending, completed, overdue
- **View Filters**: All tasks, My tasks, Overdue
- **Category Filter**: Dropdown to filter by category
- **Wedding Filter**: Dropdown to filter by wedding
- **Task List**: Checkbox, icon, title, wedding name, assignee, due date
- **Status Toggle**: Click checkbox to mark done

#### 6. Vendors (`/vendors`)
- **Search Bar**: Search by name, contact, city
- **Category Filter**: Dropdown filter
- **Vendor Cards**: Name, category, contact, phone, email, city, rating, price range
- **Add/Edit Modal**: Full vendor form with star rating
- **Delete**: Soft delete (deactivate)

#### 7. Settings (`/settings`) - Admin Only
- **User List**: All users with avatar, name, email
- **Role Dropdown**: Change user role
- **Active Toggle**: Activate/deactivate users
- **System Info**: Version, user counts
- **Quick Actions**: Export, logs, health check (placeholders)

---

## Data Flow & Connections

### Authentication Flow

```
1. User enters credentials
           │
           ▼
2. POST /api/auth/login
           │
           ▼
3. Server validates credentials
   ├── Invalid → Return 401 error
   └── Valid → Generate JWT token
           │
           ▼
4. Token stored in localStorage
           │
           ▼
5. All subsequent requests include:
   Header: "Authorization: Bearer <token>"
           │
           ▼
6. Server middleware (protect) validates token
   ├── Invalid/Expired → Return 401, redirect to login
   └── Valid → Attach user to req.user, continue
```

### Lead to Wedding Conversion Flow

```
1. Lead created with stage: "inquiry"
           │
           ▼
2. Lead progresses through stages:
   inquiry → proposal → negotiation → booked
           │
           ▼
3. When stage = "booked", admin/manager can convert
           │
           ▼
4. POST /api/leads/:id/convert
           │
           ▼
5. Server creates new Wedding document:
   - Copies: name, client info, date, budget, venue
   - Sets: relationshipManager = lead.assignedTo
   - Links: wedding.lead = lead._id
           │
           ▼
6. Server updates Lead document:
   - Sets: convertedToWedding = wedding._id
   - Adds activity: "Converted to wedding"
           │
           ▼
7. Returns both wedding and updated lead
```

### Task Maker-Checker Flow

```
1. Task created with status: "pending"
   (by any authenticated user)
           │
           ▼
2. Assigned team member works on task
           │
           ▼
3. Team member marks complete:
   PUT /api/tasks/:id/status { status: "done" }
   - Server sets: completedAt, completedBy
           │
           ▼
4. Admin/Manager reviews and verifies:
   PUT /api/tasks/:id/status { status: "verified" }
   - Server checks: user.role is admin or manager
   - Server sets: verifiedAt, verifiedBy
           │
           ▼
5. Task now counts as "fully completed"
   - Progress calculation includes verified tasks
```

### Notification System Flow

```
1. Trigger event occurs:
   - Lead assigned to user
   - Task assigned to user
   - Task due date approaching
           │
           ▼
2. Server creates Notification:
   {
     user: assignedUserId,
     type: "lead_assigned" | "task_assigned",
     title: "New Lead Assigned",
     message: "You have been assigned: Lead Name",
     relatedTo: { model: "Lead", id: leadId }
   }
           │
           ▼
3. User's frontend polls or receives notification
   GET /api/dashboard/notifications
           │
           ▼
4. Bell icon shows unread count
           │
           ▼
5. User clicks notification:
   PUT /api/dashboard/notifications/:id/read
```

### Wedding Progress Calculation

```
1. Frontend requests wedding detail:
   GET /api/weddings/:id
           │
           ▼
2. Server fetches all tasks for wedding:
   Task.find({ wedding: weddingId })
           │
           ▼
3. Server calculates progress:
   completed = tasks where status is 'done' OR 'verified'
   progress = (completed.length / total.length) * 100
           │
           ▼
4. Returns wedding with:
   {
     ...weddingData,
     progress: 65,
     taskStats: {
       total: 20,
       completed: 13,
       pending: 7
     }
   }
```

---

## Feature Workflows

### Complete Lead Management Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LEAD LIFECYCLE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CREATE LEAD                                                      │
│     └─► Manager creates lead from inquiry                            │
│         └─► Assigns to Relationship Manager                          │
│             └─► Notification sent to assignee                        │
│                                                                      │
│  2. NURTURE LEAD                                                     │
│     └─► Add activities (calls, emails, meetings)                     │
│         └─► Update follow-up dates                                   │
│             └─► Progress through stages via Kanban drag-drop         │
│                                                                      │
│  3. CONVERT OR LOSE                                                  │
│     ├─► SUCCESS: Stage = "booked"                                    │
│     │   └─► Click "Convert to Wedding"                               │
│     │       └─► Wedding created with lead data                       │
│     │           └─► Lead marked as converted                         │
│     │                                                                │
│     └─► FAILURE: Stage = "lost"                                      │
│         └─► Add activity noting reason                               │
│             └─► Lead archived                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Complete Wedding Execution Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WEDDING EXECUTION                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. SETUP PHASE                                                      │
│     ├─► Wedding created (from lead conversion or manually)           │
│     ├─► Assign Relationship Manager                                  │
│     ├─► Add team members with roles                                  │
│     └─► Add vendors (catering, decor, photo, etc.)                   │
│                                                                      │
│  2. PLANNING PHASE                                                   │
│     ├─► Create tasks by category:                                    │
│     │   ├─► F&B tasks (menu, tasting, final count)                   │
│     │   ├─► Decor tasks (theme, flowers, lighting)                   │
│     │   ├─► Logistics tasks (transport, accommodation)               │
│     │   ├─► AV tasks (sound, video, projection)                      │
│     │   └─► Other categories...                                      │
│     │                                                                │
│     ├─► Assign tasks to team members                                 │
│     └─► Set due dates for each task                                  │
│                                                                      │
│  3. EXECUTION PHASE                                                  │
│     ├─► Team members complete assigned tasks                         │
│     │   └─► Mark tasks as "done"                                     │
│     │                                                                │
│     ├─► Manager/Admin verifies completed tasks                       │
│     │   └─► Mark tasks as "verified"                                 │
│     │                                                                │
│     └─► Progress bar updates automatically                           │
│                                                                      │
│  4. COMPLETION                                                       │
│     ├─► All tasks verified                                           │
│     ├─► Wedding date passes                                          │
│     └─► Status changed to "completed"                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Daily User Workflows

#### Admin Daily Workflow
```
1. Check Dashboard
   └─► Review overall stats and trends
2. Review overdue tasks
   └─► Follow up with team members
3. Verify completed tasks
   └─► Maker-checker approval
4. Manage users if needed
   └─► Add new team members, update roles
5. Monitor lead pipeline
   └─► Check conversion progress
```

#### Relationship Manager Daily Workflow
```
1. Check Dashboard
   └─► Review assigned leads and weddings
2. Follow up on leads
   └─► Add call/email activities
   └─► Move leads through pipeline
3. Review wedding progress
   └─► Check task completion
   └─► Verify team member tasks
4. Coordinate with vendors
   └─► Update vendor confirmations
5. Convert booked leads
   └─► Create weddings
```

#### Team Member Daily Workflow
```
1. Check "My Tasks" view
   └─► See assigned tasks across all weddings
2. Complete pending tasks
   └─► Mark as "done" when finished
3. Check overdue tasks
   └─► Prioritize urgent items
4. View assigned wedding details
   └─► Understand overall progress
```

---

## Security Implementation

### Password Security
- Passwords hashed using bcrypt with 12 salt rounds
- Passwords never returned in API responses (select: false)
- Password comparison using secure timing-safe comparison

### JWT Token Security
- Token contains only user ID
- Token expires after 7 days (configurable)
- Token verified on every protected route
- Invalid tokens result in 401 response and redirect to login

### Role-Based Access Control
```javascript
// Middleware: protect - Verifies JWT
// Middleware: authorize(...roles) - Checks user role
// Middleware: isAdminOrManager - Shorthand for admin/manager check

// Example protected route:
router.delete('/:id', protect, authorize('admin'), deleteLead);

// Example admin/manager route:
router.post('/:id/convert', protect, isAdminOrManager, convertToWedding);
```

### Data Access Control
- Team members only see data assigned to them
- Queries filtered based on user role
- Frontend hides UI elements based on permissions
- Backend validates permissions regardless of frontend

---

## Error Handling

### Backend Error Types
```javascript
// Validation Error (400)
{ message: "Name is required, Phone is required" }

// Duplicate Key Error (400)
{ message: "email already exists" }

// Not Found Error (404)
{ message: "Lead not found" }

// Unauthorized Error (401)
{ message: "Not authorized, no token" }

// Forbidden Error (403)
{ message: "Role team_member is not authorized to access this route" }

// Server Error (500)
{ message: "Server Error" }
```

### Frontend Error Handling
- API interceptor catches 401 errors → Redirects to login
- Form validation shows inline errors
- Failed requests show error messages in UI
- Loading states prevent duplicate submissions

---

This documentation covers the complete Wedding CRM system. For specific implementation details, refer to the source code in the respective files.
