# SprintDesk — API Documentation

SprintDesk uses three data sources. This document covers every endpoint the
frontend calls, organized by service file.

---

## 1. DummyJSON — Authentication

Base URL: `https://dummyjson.com`

Public, keyless REST API. No API key or environment variable needed.

### `POST /auth/login`

Used by: `api/authService.ts → authService.login()`

**Request body**
```json
{
  "username": "emilys",
  "password": "emilyspass",
  "expiresInMins": 1
}
```
> `expiresInMins` is intentionally short (1 minute) in this app so the
> silent-refresh flow is easy to demo/verify — the token expires quickly
> and you can watch a 401 → refresh → retry cycle happen in the Network tab.

**Response `200`**
```json
{
  "id": 1,
  "username": "emilys",
  "email": "emily.johnson@x.dummyjson.com",
  "firstName": "Emily",
  "lastName": "Johnson",
  "image": "https://dummyjson.com/icon/emilys/128",
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Response `400`** — invalid credentials.

---

### `POST /auth/refresh`

Used by:
- `api/httpClient.ts` — automatically, from the response interceptor, on
  any `401`
- `features/auth/useAuth.ts → useBootstrapSession()` — once on app load, if
  a refresh token exists in `localStorage`

**Request body**
```json
{
  "refreshToken": "<jwt from previous login/refresh>",
  "expiresInMins": 30
}
```

**Response `200`**
```json
{
  "accessToken": "<new jwt>",
  "refreshToken": "<new jwt>"
}
```

**Response `403`** — refresh token invalid/expired. The app responds by
clearing the session (`authStore.clearSession()`) and redirecting to
`/login`.

---

### `GET /auth/me`

Used by: `api/authService.ts → authService.getCurrentUser()`, called once
during `useBootstrapSession()` after a successful silent refresh, to
re-fetch the user's profile for the restored session.

**Headers**: `Authorization: Bearer <accessToken>`

**Response `200`**: same user shape as the `login` response (minus tokens).

---

## 2. JSONPlaceholder — Notification Polling

Base URL: `https://jsonplaceholder.typicode.com`

Public, keyless REST API. Used **only** to simulate a stream of real-time
activity for the notification system — it has no relationship to
SprintDesk's actual task/user data.

### `GET /posts?_limit=5`

Used by: `api/notificationService.ts → notificationService.fetchLatestPosts()`

Called via `hooks/useNotificationPolling.ts` on a 15-second interval
(paused while the browser tab is hidden).

**Response `200`**
```json
[
  { "id": 1, "userId": 1, "title": "...", "body": "..." },
  { "id": 2, "userId": 1, "title": "...", "body": "..." }
]
```

Each `post.id` is namespaced to `post-{id}` and compared against
already-seen notification IDs (`notificationStore`) — only genuinely new
ids are turned into notifications and (if the panel is closed) trigger a
toast.

> Note: this endpoint always returns the same 5 posts (JSONPlaceholder is
> a static fake API), so after the first poll no *new* notifications will
> appear from this source in a given session — this matches the
> assignment's intent of "treat new post IDs as new notifications" using a
> mock upstream.

---

## 3. `mock-data.json` — Primary Application Data

Not a network request — bundled as a static asset and read through
`api/boardService.ts` and `api/notificationService.ts`. Simulates a real
backend's response shape so it can be swapped later with minimal UI
changes.

| Collection | Consumed by | Notes |
|---|---|---|
| `users` | `boardService.getUsers()` | assignees, comment authors, current-session avatar |
| `sprints` | `boardService.getSprints()` | sprint velocity chart, task creation form |
| `tasks` | `boardService.getTasks() / createTask() / updateTask() / deleteTask()` | held in an in-memory mutable copy so create/update/delete persist for the session |
| `comments` | `boardService.getComments() / addComment()` | scoped by `taskId` |
| `notifications` | `notificationService.getInitialNotifications()` | seeds the notification panel on first load |

### Internal "endpoints" (function signatures, not HTTP)

```ts
boardService.getUsers(): Promise<User[]>
boardService.getSprints(): Promise<Sprint[]>
boardService.getTasks(): Promise<Task[]>
boardService.getComments(taskId: number): Promise<Comment[]>
boardService.createTask(input: NewTaskInput): Promise<Task>
boardService.updateTask(id: number, changes: Partial<Task>): Promise<Task>
boardService.deleteTask(id: number): Promise<void>
boardService.addComment(taskId: number, authorId: number, message: string): Promise<Comment>
```

All resolve after an artificial delay (`~150–300ms`) to realistically
exercise TanStack Query's loading states, exactly as a real network call
would.

---

## Error Handling Summary

| Source | Failure mode | App behavior |
|---|---|---|
| DummyJSON login | `400` invalid credentials | Inline form error, no redirect |
| DummyJSON refresh | `403` invalid/expired refresh token | Session cleared, redirect to `/login` |
| Any authenticated request | `401` (expired access token) | Silent refresh + automatic retry, transparent to the user |
| JSONPlaceholder poll | network error / non-200 | Silently ignored — a transient polling failure doesn't interrupt the user with a repeating error toast |
| `boardService` mutations | rejected promise | Surfaced via a toast (`useToast().toast.error(...)`) from the calling component |
