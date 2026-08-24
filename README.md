# SprintDesk

A sprint management dashboard for software development teams — Kanban board with drag-and-drop, sprint analytics, real-time notifications, authentication, and a from-scratch component library.

Built with React 18, TypeScript (strict mode), Vite, TanStack Query, Zustand, Tailwind CSS, React Router, Recharts, and @dnd-kit.

## Features

- **Authentication** — DummyJSON-backed login, in-memory access token, persisted refresh token, silent token refresh with automatic request retry, protected routes
- **Kanban Board** — 4 columns (Backlog, In Progress, Review, Done), drag-and-drop reordering within and across columns (mouse, touch, and keyboard), task detail drawer with comments, add/delete tasks, priority and assignee filters
- **Analytics Dashboard** — sprint velocity, task status distribution, priority breakdown, and completion trend charts, all derived from live board data
- **Notifications** — polls for new activity, unread badge, mark as read / mark all as read, pagination, pauses when the tab is hidden
- **Design System** — Button, Input, Select, Modal, Toast, DataTable, Skeleton — built from scratch with Tailwind, no external UI library
- **Dark / Light theme** — persisted across sessions
- **Testing** — unit tests for the toast hook, board store, and the auth refresh/retry interceptor

## Tech Stack

| Area | Choice |
|---|---|
| Framework | React 18 + TypeScript (strict) |
| Build tool | Vite |
| Server state | TanStack Query v5 |
| Client state | Zustand (+ `persist` middleware) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Charts | Recharts |
| Drag & drop | @dnd-kit |
| Testing | Vitest + React Testing Library |
| APIs | DummyJSON (auth), JSONPlaceholder (notification polling), local `mock-data.json` (users, sprints, tasks, comments) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/sunilnishad99/sprintdesk-frontend.git
cd sprintdesk-frontend
npm install
```

### Environment Variables

None required — the app talks to public APIs (DummyJSON, JSONPlaceholder)
directly from the client, and `mock-data.json` is bundled with the app as a
static asset.

### Run locally

```bash
npm run dev
```

Open `http://localhost:5173`.

### Test credentials

Log in with any [DummyJSON test user](https://dummyjson.com/users), e.g.:

- Username: `emilys`
- Password: `emilyspass`

### Run tests

```bash
npm run test
```

### Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

## Project Structure

```
src/
  api/            # service layer — the only place that talks to mock-data.json / external APIs
  components/
    board/        # Kanban-specific components (Board, Column, TaskCard, TaskDrawer, modals)
    notifications/
    ui/           # design system (Button, Input, Select, Modal, Toast, DataTable, Skeleton...)
  features/auth/  # auth-specific hooks
  hooks/          # TanStack Query hooks (server state)
  layouts/        # AppLayout (authenticated shell: nav, bell, theme toggle)
  pages/          # route-level page components
  router/         # AppRouter, ProtectedRoute
  store/          # Zustand stores (auth, board columns, toast, notifications, theme)
  types/          # shared TypeScript types
  utils/          # pure helper functions (e.g. analytics aggregation)
  data/           # mock-data.json
```

See `ARCHITECTURE.md` for a deeper explanation of the data flow and state
management decisions, and `API_DOCUMENTATION.md` for the endpoints used.

## Known Limitations / Future Improvements

- **Recharts dark mode**: chart axis/legend colors don't yet respond to
  the dark theme toggle (SVG-based, needs a separate theming pass)
- **Undo drag-and-drop** (bonus) not implemented
- **Custom date-range filtering on Analytics** (bonus) not implemented
- **Export analytics as PNG** (bonus) not implemented
- **Remember Me / 30-day persistence** (bonus) not implemented — sessions
  persist via the refresh token for the DummyJSON-issued lifetime
- **Storybook** (bonus) not implemented
- **axe-core automated a11y testing** (bonus) not implemented — manual
  accessibility passes were done instead (labels, keyboard nav, focus
  management, alt text)
