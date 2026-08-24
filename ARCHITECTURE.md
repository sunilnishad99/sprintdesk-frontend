# SprintDesk — Architecture

## 1. Overview

SprintDesk is a single-page application. There is no custom backend — three
data sources stand in for one:

| Source | Used for |
|---|---|
| `mock-data.json` (bundled locally) | users, sprints, tasks, comments, initial notifications |
| DummyJSON (`https://dummyjson.com`) | authentication (login, refresh) |
| JSONPlaceholder (`https://jsonplaceholder.typicode.com`) | simulated real-time notification polling |

The app is built so that swapping any of these for a real backend later
requires touching only the **service layer** — nothing in the UI layer
knows or cares where its data actually comes from.

## 2. Layered Architecture

```
UI Components  (pages/, components/)
      ↓  calls
Hooks Layer    (hooks/*.ts — TanStack Query)   +   Zustand Stores (store/*.ts)
      ↓  calls
Service Layer  (api/*.ts)
      ↓  calls
Data Source    (mock-data.json | DummyJSON | JSONPlaceholder)
```

**Rule enforced throughout the codebase:** no component ever imports
`mock-data.json` or calls `fetch`/`axios` directly. Every request goes
through a named function in `api/`. This is what makes the "swap the mock
data for a real backend" requirement cheap — only `api/*.ts` changes.

## 3. State Management — three kinds, three tools

| State kind | Tool | Examples |
|---|---|---|
| **Server state** | TanStack Query | tasks, users, sprints, comments — anything with a loading/error/cache lifecycle |
| **Client / app state** | Zustand (some persisted) | auth session, board column order, notifications, toast queue, theme |
| **Local component state** | `useState` | form fields, filter dropdown selections, modal open/close |

### Why board column order is Zustand, not TanStack Query

Task *content* (title, assignee, priority...) is server state. But the
*order* of cards within/across columns from drag-and-drop has no real
backend endpoint in this assignment — it's a UI-only concern. Modeling it
as Zustand client state (persisted to localStorage) avoids two problems:
storing server data twice, and needing a fake "reorder" API endpoint just
to satisfy TanStack Query's mental model. `boardStore.ts` stays in sync
with the task list via `hydrateFromTasks` (seed once) and
`addTaskToColumn` / `removeTaskFromColumn` (keep in sync on create/delete).

The same reasoning applies to **notifications** (accumulated over time via
polling, not a single cacheable resource) and **theme** (pure UI
preference, no server counterpart).

## 4. Authentication Flow

```
LoginPage
  → useLogin() mutation → authService.login() → POST /auth/login
  → on success: authStore.setSession(user, accessToken, refreshToken)
       - accessToken: kept in memory ONLY (never in localStorage) — reduces
         XSS exposure window
       - refreshToken: persisted to localStorage (simulates "remember this
         session")

httpClient (axios instance)
  - request interceptor: attaches `Authorization: Bearer <accessToken>`
    from authStore to every outgoing request
  - response interceptor: on 401 →
      1. if a refresh is already in flight, queue this request
      2. otherwise, call POST /auth/refresh with the stored refresh token
      3. on success: update accessToken in authStore, retry the original
         request with the new token, flush the queue
      4. on failure: clear the session, redirect to /login

App boot (useBootstrapSession)
  - on mount, if a refresh token exists in localStorage, silently exchange
    it for a fresh access token + user before rendering any protected route
  - shows a full-screen loader during this check — this is what makes
    "session persists after refresh" and "no flash of the login page for
    an already-logged-in user" both work
```

## 5. Kanban Board — Drag and Drop

- `@dnd-kit/core` + `@dnd-kit/sortable` provide `DndContext`,
  `useSortable` (cards), and `useDroppable` (columns)
- Three sensors are registered: `PointerSensor` (mouse), `TouchSensor`
  (mobile, with a short press-and-hold delay so it doesn't conflict with
  page scrolling), and `KeyboardSensor` (Tab to a card → Space to lift →
  arrow keys to move → Space to drop)
- On drop: `boardStore.moveTask()` updates local column order immediately
  (optimistic, no loading state needed since it's client state); if the
  task crossed columns, `useUpdateTask()` also fires to persist the new
  `status` server-side and triggers a query invalidation

## 6. Analytics

`utils/analytics.ts` contains pure functions
(`getSprintVelocity`, `getStatusDistribution`, `getPriorityByStatus`,
`getCompletionTrend`) that transform the same `Task[]` array the board
uses into chart-ready shapes. Because `AnalyticsPage` reads from the same
TanStack Query cache as the Board (`useTasks()`), any change made on the
Board (drag a card, add a task) is reflected on the Analytics page without
any extra wiring — both pages are just different views over one cache.

## 7. Notifications

```
AppLayout (mounted once, for every authenticated route)
  → useNotificationPolling()
      - setInterval(poll, 15s)
      - document.visibilitychange listener: pauses the interval when the
        tab is hidden, resumes (and polls immediately) when visible
      - each poll: notificationService.fetchLatestPosts() → GET
        JSONPlaceholder /posts?_limit=5 → notificationStore.addFromPosts()
        deduplicates against already-seen post IDs
      - if new notifications arrived AND the panel is currently closed,
        shows a toast (avoids double-signaling if the person can already
        see the list update live)
  → notificationStore (Zustand, persisted)
      - seeded once from mock-data.json's `notifications` array
      - read/unread state and full notification history persist across
        reloads
```

## 8. Design System

All components in `components/ui/` are built from scratch with Tailwind —
no MUI/Chakra/Ant/Shadcn. Each is generic and reused across multiple
features (e.g. `Modal` backs both the Add Task form and the Delete
confirmation; `Select` is used in the Add Task form, the Task drawer, and
the board's filter bar).

## 9. Performance

- **Route-level code splitting**: every page is `React.lazy`-loaded behind
  a `Suspense` boundary in `AppRouter.tsx`
- **`React.memo`**: `TaskCard` — the component most likely to re-render
  unnecessarily, since a 30-task board mounts ~30 of them and any single
  drag/edit would otherwise re-render all of them
- **`useMemo`**: all derived/expensive computations — `tasksById`,
  `usersById`, `filteredColumns` (Board); the four analytics aggregations
  (Analytics); summary stats (Dashboard)

## 10. Testing Strategy

Three units were chosen because they carry real logic (not just JSX):

- `useToast` — the public API every feature uses to surface feedback;
  tested via `renderHook` against the underlying Zustand store
- `boardStore` — hydrate/add/move/remove are pure state transitions, ideal
  for direct unit testing without rendering anything
- `httpClient`'s auth interceptor — the trickiest piece of logic in the
  app (401 → refresh → retry → queue concurrent requests); tested with
  `axios-mock-adapter` against the real interceptor, not a reimplementation
  of it, so the test exercises the actual code path a real 401 would hit
