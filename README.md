# ✅ TaskFlow — MERN To-Do App v2

A full-stack, multi-user To-Do application built with the **MERN** stack.
Features JWT authentication, a responsive dark/light UI, advanced task
management, and a personalised dashboard.

## Screenshots

> _Add screenshots to this section once the app is running._

| Light mode | Dark mode |
|------------|-----------|
| ![light](./screenshots/light.png) | ![dark](./screenshots/dark.png) |

---

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 18 · Vite · React Router v6 · react-icons |
| Backend  | Node.js · Express.js · express-validator      |
| Database | MongoDB · Mongoose                            |
| Auth     | JWT · bcryptjs                                |
| HTTP     | Axios                                         |

---

## Features

### Authentication
- Register / Login / Logout
- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in `localStorage`, attached via Axios request interceptor
- Automatic session restore on page reload (`GET /api/auth/me`)
- Protected routes — unauthenticated users redirected to `/login`

### Multi-user support
- Every task is linked to its owner via a `user` reference
- All task queries are scoped to `req.user._id` — users only see their own data

### Task management
- Add tasks with title, description, priority (Low/Medium/High), category, and due date
- Mark complete/incomplete (strikethrough on completed tasks)
- Inline edit — all fields editable in-place
- Delete with confirmation dialog
- Overdue due-date badge
- Priority colour badges

### Dashboard
- Greeting by time of day
- Stat cards: total / completed / pending / completion %
- Animated progress bar
- Recent 5 tasks with quick-add form

### Task list page
- Search (title, description, category)
- Filter by status (All / Pending / Completed) and priority
- Sort by newest, oldest, A→Z, priority, due date
- Pagination (10 tasks per page)

### UI / UX
- Dark / light mode toggle — preference saved in `localStorage`
- Skeleton loaders while fetching
- Toast notifications (success / error / info / warning)
- Confirmation dialog before deletion
- Fully responsive: desktop, tablet, and mobile
- Navbar with user avatar and dropdown menu
- Footer

---

## Project Structure

```
todo-app/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # register, login, getMe, updateProfile
│   │   └── taskController.js      # CRUD + stats + search/filter/sort
│   ├── middleware/
│   │   └── auth.js                # JWT verification middleware
│   ├── models/
│   │   ├── User.js                # name, email, password (hashed)
│   │   └── Task.js                # title, completed, priority, category, dueDate, user ref
│   ├── routes/
│   │   ├── authRoutes.js          # /api/auth/*
│   │   └── taskRoutes.js          # /api/tasks/*  (all protected)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # user state, login/register/logout
│   │   │   ├── ThemeContext.jsx   # dark/light toggle + localStorage
│   │   │   └── ToastContext.jsx   # global toast queue
│   │   ├── components/
│   │   │   ├── ConfirmDialog.jsx  # reusable modal confirm
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx         # nav links, user menu, theme toggle
│   │   │   ├── ProtectedRoute.jsx # redirects to /login if not authed
│   │   │   ├── Skeleton.jsx       # skeleton loader components
│   │   │   ├── Stats.jsx          # dashboard stat cards
│   │   │   ├── TaskForm.jsx       # add/edit form with all fields
│   │   │   ├── TaskItem.jsx       # single task card
│   │   │   ├── TaskList.jsx       # toolbar + paginated list
│   │   │   └── Toast.jsx          # toast renderer
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── NotFoundPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── App.jsx                # router setup + layout
│   │   ├── api.js                 # Axios instance + auth/task helpers
│   │   ├── main.jsx
│   │   └── index.css              # full design system (light + dark)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **or** a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Setup & Installation

### 1. Clone / download

```bash
git clone <your-repo-url>
cd todo-app
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create your `.env` file:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `backend/.env`:

```env
# Local MongoDB
MONGO_URI=mongodb://localhost:27017/todoapp

# MongoDB Atlas
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/todoapp

PORT=5000

# Generate a strong secret:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRES_IN=7d
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

---

## Running the App

Open **two terminals**:

### Terminal 1 — Backend

```bash
cd todo-app/backend
npm run dev       # development (nodemon auto-restart)
# or
npm start         # production
```

Expected output:
```
MongoDB connected: localhost
Server running on http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd todo-app/frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in Xms
  ➜  Local:   http://localhost:3000/
```

Open **http://localhost:3000** — create an account and start adding tasks.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint          | Auth | Description            |
|--------|-------------------|------|------------------------|
| POST   | `/register`       | No   | Create account         |
| POST   | `/login`          | No   | Login, returns JWT     |
| GET    | `/me`             | Yes  | Get current user       |
| PUT    | `/profile`        | Yes  | Update name/password   |

### Tasks — `/api/tasks` (all require JWT)

| Method | Endpoint          | Description                            |
|--------|-------------------|----------------------------------------|
| GET    | `/`               | Get tasks (search, filter, sort, page) |
| GET    | `/stats`          | Dashboard aggregate counts             |
| GET    | `/:id`            | Get one task                           |
| POST   | `/`               | Create task                            |
| PUT    | `/:id`            | Update task                            |
| DELETE | `/:id`            | Delete task                            |

#### Task query params

| Param    | Values                                    |
|----------|-------------------------------------------|
| search   | any string                                |
| status   | `all` \| `pending` \| `completed`         |
| sort     | `newest` \| `oldest` \| `alpha` \| `priority` \| `dueDate` |
| priority | `low` \| `medium` \| `high`               |
| category | any string                                |
| page     | number (default 1)                        |
| limit    | number (default 10, max 50)               |

---

## Schemas

### User
```js
{ name, email, password (hashed), createdAt }
```

### Task
```js
{ user (ref), title, description, completed, priority, category, dueDate, createdAt }
```

---

## Routes (Frontend)

| Path        | Auth required | Description         |
|-------------|---------------|---------------------|
| `/`         | Redirect      | → `/dashboard`      |
| `/login`    | No            | Login page          |
| `/register` | No            | Registration page   |
| `/dashboard`| Yes           | Stats + recent tasks |
| `/tasks`    | Yes           | Full task list      |
| `/profile`  | Yes           | User profile        |
| `*`         | —             | 404 page            |

---

## Common Issues

**"Could not load tasks" / API calls return 401**
→ Make sure the backend is running and `JWT_SECRET` is set in `.env`.

**MongoDB connection error**
→ Check MongoDB is running locally, or verify your Atlas connection string.

**Port already in use**
→ Change `PORT` in `backend/.env` and update the Vite proxy target in `frontend/vite.config.js`.

**Dark mode not persisting**
→ The preference is stored in `localStorage` under the key `theme`. Clear it to reset.

---

## Dependencies

### Backend
| Package            | Version  | Purpose           |
|--------------------|----------|-------------------|
| express            | ^4.19.2  | HTTP framework    |
| mongoose           | ^8.4.1   | MongoDB ODM       |
| bcryptjs           | ^2.4.3   | Password hashing  |
| jsonwebtoken       | ^9.0.2   | JWT auth          |
| express-validator  | ^7.1.0   | Input validation  |
| cors               | ^2.8.5   | CORS headers      |
| dotenv             | ^16.4.5  | Env variables     |
| nodemon (dev)      | ^3.1.3   | Auto-restart      |

### Frontend
| Package            | Version  | Purpose           |
|--------------------|----------|-------------------|
| react              | ^18.3.1  | UI library        |
| react-dom          | ^18.3.1  | DOM renderer      |
| react-router-dom   | ^6.23.1  | Client routing    |
| axios              | ^1.7.2   | HTTP client       |
| react-icons        | ^5.2.1   | Icon library      |
| vite               | ^5.3.1   | Build tool        |
