# Software Design Document (SDD)

**Team name:** CoreStack (Group G1, Section-1)  
**Version:** ☐ First version (Week 6) ☒ Final (Week 10)  
**Last updated:** 2026-11-15  
**Project:** Gelişim Ağı – AI-Assisted Child Development Platform

Requirement IDs refer to [SRS.md](SRS.md). This version describes the code on `main` after M1–M8 were merged (PR #8, 2026-11-15).

---

## 1. Architecture Overview

Gelişim Ağı is a three-tier web application. A React single-page app (built with Vite) calls a REST/JSON API under `/api`, served by a Node.js + Express backend that stores data in a single SQLite file through better-sqlite3 and uploaded files in a folder on disk. In development the Vite dev server proxies `/api` to the backend on port 3001. AI summaries come from one backend module that either uses a built-in mock (default) or calls Gemini or GitHub Models.

```mermaid
flowchart TB
    User(["Parent / specialist / child<br/>(browser)"])
    subgraph Frontend["Frontend: React SPA (Vite, port 5173)"]
        Pages["Pages: Login, ChildrenList,<br/>ChildWorkspace, ChildHome"]
        ApiClient["lib/api.js<br/>(fetch + Bearer token)"]
    end
    subgraph Backend["Backend: Node.js + Express (port 3001)"]
        Auth["authenticate<br/>(JWT)"]
        Access["childAccess<br/>(parent / linked specialist / child)"]
        Routes["Routers: auth, children, links, events,<br/>tasks, entries, documents, stats,<br/>ai-summary, ai-summary/feedback"]
        Services["Services: weeks, stats,<br/>aiService + aiPrompts"]
    end
    DB[("SQLite<br/>backend/data/app.db")]
    Files[("Uploads folder<br/>backend/data/uploads")]
    LLM["Gemini / GitHub Models<br/>(only if AI_PROVIDER is set)"]

    User --> Pages --> ApiClient -->|"/api/* JSON"| Auth --> Access --> Routes
    Routes --> Services
    Routes --> DB
    Services --> DB
    Routes --> Files
    Services -.->|HTTPS| LLM
```

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3, React Router 7, Vite 5.4 (@vitejs/plugin-react), framer-motion (animations), Geist variable font. Plain CSS in `src/styles.css`. |
| Backend | Node.js ≥ 22, Express 4.21 (CommonJS). jsonwebtoken 9 (sessions), bcryptjs 3 (password hashes), multer 2 (uploads, memory storage). |
| Database | SQLite through better-sqlite3 13 (foreign keys on, WAL journal for file databases). Uploaded files on disk in `UPLOAD_DIR`. |
| AI | `AI_PROVIDER` = `mock` (default), `gemini` (`GEMINI_API_KEY`, `GEMINI_MODEL`, default gemini-2.5-flash) or `github` (`GITHUB_TOKEN`, `GITHUB_MODEL`, default openai/gpt-4o-mini). Calls use the built-in `fetch`. |
| Testing | Jest 29 + Supertest 7 (backend, in-memory SQLite), Vitest 2 + Testing Library + jsdom (frontend), coverage with Jest and @vitest/coverage-v8. Playwright end-to-end tests are planned (CST-26 and the other end-to-end tasks). |
| CI | GitHub Actions (`.github/workflows/ci.yml`) on Node.js 22: backend tests with coverage, frontend tests with coverage and the frontend build, on every push to `main` and every pull request. |

There is no Docker or deployment configuration. The application runs in development mode (`npm run dev:backend`, `npm run dev:frontend`).

---

## 2. Module Design

| Module | Main components | Implements requirements |
|---|---|---|
| M1 – Login and roles | `routes/auth.js`, `middleware/auth.js` (authenticate), `auth.jsx` (AuthProvider, homePath), `App.jsx` (RequireRole routes), `pages/Login.jsx`, `components/Layout.jsx` | FR-M1-01 – FR-M1-11 |
| M2 – Linking specialists | `middleware/childAccess.js` (childAccess, roleOnChild), `routes/children.js`, `routes/links.js`, `pages/ChildrenList.jsx`, `pages/ChildWorkspace.jsx`, `components/Links.jsx` | FR-M2-01 – FR-M2-09 |
| M3 – Weekly schedule | `routes/events.js`, `services/weeks.js` (resolveWeek), `components/Schedule.jsx` (EventForm), `components/ui.jsx` (WeekNav), `lib/dates.js` | FR-M3-01 – FR-M3-05 |
| M4 – Tasks | `routes/tasks.js`, `components/Tasks.jsx` (TaskForm, "Yaptım!" button, "Verdiklerim" filter), `pages/ChildHome.jsx` | FR-M4-01 – FR-M4-09 |
| M5 – Specialist entries | `routes/entries.js`, `components/Entries.jsx` (EntryForm for add and edit) | FR-M5-01 – FR-M5-07 |
| M6 – Documents | `routes/documents.js` (multer, signature check), `components/Documents.jsx`, `lib/api.js` (fetchBlob) | FR-M6-01 – FR-M6-08 |
| M7 – Weekly statistics | `services/stats.js` (weeklyStats), `routes/stats.js`, `components/Stats.jsx`, `components/WeekGlance.jsx` | FR-M7-01, FR-M7-02, FR-M7-05, FR-M7-06 |
| M8 – Role-based AI summary | `services/aiService.js` (generateSummary, mockSummary, Gemini and GitHub Models adapters), `services/aiPrompts.js`, `routes/aiSummary.js`, `routes/aiFeedback.js`, `components/AiSummary.jsx` | FR-M8-01 – FR-M8-11 |

The tables below give the details per module.

### Shared foundation

| Component | Responsibility |
|---|---|
| `backend/src/app.js` – `createApp({ db, config, aiFetch })` | Builds the Express app: parses JSON up to 100 kB, serves `GET /api/health`, mounts `authenticate` on `/api/children` and then every module router, answers unknown `/api` paths with a JSON 404. One error handler turns `HttpError`, multer errors (413 for size) and bad JSON (400) into `{ error }`; anything else is a 500. `aiFetch` lets tests replace the network. |
| `backend/src/server.js` | Opens the database, warns if it has no users, starts the app on `PORT`. |
| `backend/src/config.js` – `loadConfig()` | Reads `PORT`, `JWT_SECRET`, `DB_PATH`, `UPLOAD_DIR` (made absolute), `AI_PROVIDER`, `GEMINI_*`, `GITHUB_*`. Upload limit 10 MB. |
| `backend/src/db.js` – `openDb()` | Opens SQLite (or `:memory:` in tests), enables foreign keys and WAL, creates the 8 tables and 4 indexes. |
| `backend/src/validate.js` | `isDate` (YYYY-MM-DD, real calendar date), `isDateTime` (YYYY-MM-DDTHH:MM[:SS]), `cleanString` (trimmed, non-empty, max length), `HttpError`. |
| `backend/src/mappers.js` | Turns database rows (snake_case) into API objects (camelCase). Never returns password hashes. |
| `backend/src/constants.js` | Allowed values: `AREAS`, `SPECIALTIES`, `DOC_TYPES`, `FEEDBACK_RATINGS`. |
| `backend/src/seed.js`, `backend/scripts/seed.js` | Resets the database and inserts 8 synthetic users, 2 children, 4 links, 6 events, 7 tasks and 5 entries placed in the current week. |
| `frontend/src/lib/api.js` | `api.get/post/put/patch/delete/upload` and `fetchBlob`. Adds the Bearer token from `localStorage`, turns `{ error }` into `ApiError`, and logs the user out on a 401. |
| `frontend/src/lib/useLoad.js`, `components/ui.jsx`, `toast.jsx`, `motion.jsx`, `icons.jsx`, `lib/labels.js` | Data loading hook, shared UI parts (ErrorMessage, Loading, EmptyState, AreaBadge, WeekNav), toast messages, animations, icons and Turkish labels for areas, specialties, document types and roles. |

### M1 – Login and roles

| Component | Responsibility | Requirements |
|---|---|---|
| `users` table (role CHECK parent/specialist/child, email UNIQUE COLLATE NOCASE, password_hash) | One role per account; case-insensitive e-mail. | FR-M1-02, FR-M1-06 |
| `POST /api/auth/login` | 400 if a field is empty. Looks up the user and compares with bcrypt; for an unknown e-mail it compares against a dummy hash so both failures take similar time. Returns the same 401 for both. On success signs a JWT `{ sub: id, role }` valid for 8 hours. | FR-M1-01, FR-M1-03, FR-M1-04, FR-M1-10 |
| `authenticate` middleware, `GET /api/auth/me` | Reads `Authorization: Bearer`, verifies the JWT and loads the user again from the database (401 if missing, invalid, expired or the user no longer exists). `/me` restores the session after a reload. | FR-M1-04, FR-M1-08 |
| `AuthProvider`, `RequireRole`, `Layout`, `Login` | Keeps the token in `localStorage`, routes parents and specialists to `/children` and the child to `/my`, redirects other roles to their home, shows the user and role in the top bar and logs out. | FR-M1-05, FR-M1-07, FR-M1-09, FR-M1-11 |

### M2 – Linking specialists

| Component | Responsibility | Requirements |
|---|---|---|
| `children`, `links` tables (UNIQUE child_id, specialist_id) | Parent of each child, the child's own login, child–specialist links with specialty and date. | FR-M2-01, FR-M2-02 |
| `childAccess(db, allowedRoles)` | Runs on every `/api/children/:childId/...` route. `roleOnChild` finds the caller's relation to the child (parent, linked specialist, child). If there is none, or it is not in `allowedRoles`, answers 403 — the same for a missing child, so nothing leaks. Reads `links` on every request, so unlinking takes effect at once. | FR-M2-06, FR-M2-07, FR-M1-09 |
| `GET /api/children`, `GET /api/children/:childId` | Children the caller may use (by parent_id, by links, or by user_id), and one child with the caller's role on it. | FR-M2-05 |
| Links router (parent only) | List, link by e-mail (404 if not a registered specialist, 409 if already linked, specialty defaults to the specialist's own), unlink by specialist id (404 if not linked). | FR-M2-01 – FR-M2-04, FR-M2-08 |
| `ChildrenList`, `ChildWorkspace`, `Links` | Children cards (a parent with one child goes straight to the workspace); tabs filtered by role ("Bağlı uzmanlar" only for the parent); link form and inline unlink confirmation. | FR-M2-03 – FR-M2-05, FR-M2-09 |

### M3 – Weekly schedule

| Component | Responsibility | Requirements |
|---|---|---|
| `events` table, index (child_id, starts_at) | Events with area and creator. | FR-M3-01 |
| `resolveWeek(week)` | Turns any `YYYY-MM-DD` into its Monday–Sunday range; no value means the current week; a bad value is a 400. Used by events, tasks, stats and the AI summary. | FR-M3-01, FR-M3-04 |
| Events router | `GET ?week=` for parent, specialist and child, ordered by start. `POST` for parent and specialist with checks for title, start, end ≥ start and area. | FR-M3-01 – FR-M3-03, FR-M3-05 |
| `Schedule`, `WeekNav` | Seven day columns with today highlighted; the add form only when `canAdd` (never for the child). The week selector is shared by the weekly tabs. | FR-M3-01 – FR-M3-05 |

### M4 – Tasks

| Component | Responsibility | Requirements |
|---|---|---|
| `tasks` table (status CHECK todo/done, default todo, done_at, assigned_by) | Tasks, status and completion time. | FR-M4-03, FR-M4-05 |
| Tasks router | `GET` (optional `?week=` on due_date) with the assigner's name for all three roles. `POST` for parent and specialist with validation. `PATCH /:taskId/done` only for the child; sets status and done_at once. | FR-M4-01 – FR-M4-07 |
| `Tasks` component | Task cards with status, assigner and area; done/total line; "Yaptım!" button only for the child; assign form for parent and specialist; "Tümü / Verdiklerim" filter for specialists. | FR-M4-04, FR-M4-07 – FR-M4-09 |

### M5 – Specialist entries

| Component | Responsibility | Requirements |
|---|---|---|
| `entries` table (author_id, edited, edited_at) | Entries and the edit mark. | FR-M5-01, FR-M5-05 |
| Entries router | `GET` for parent and specialist, newest first, with author name and specialty. `POST` only for a linked specialist. `PUT /:entryId` only for the author (403 otherwise), sets edited = 1 and edited_at. | FR-M5-01 – FR-M5-07 |
| `Entries` component | Timeline with area and "Düzenlendi" badges; "Düzenle" only on the user's own entries; the same form is used to add and edit. The edit time is not shown yet (SRS: FR-M5-05 partial). | FR-M5-03 – FR-M5-05 |

### M6 – Documents

| Component | Responsibility | Requirements |
|---|---|---|
| `documents` table | Metadata: original_name, mime_type, size, stored_name, doc_type, uploader. | FR-M6-04 |
| Documents router (parent and specialist only) | multer keeps the upload in memory with a 10 MB limit (413). The first bytes decide the type (PDF, PNG, JPEG), otherwise 400. The file is written as `<uuid>.<ext>` in `UPLOAD_DIR`; the original name is decoded to UTF-8 and stripped of directories. Unknown `docType` becomes `other`. Download sends the file with `Content-Disposition: attachment` (or `inline` with `?inline=1`) and `X-Content-Type-Options: nosniff`. | FR-M6-01 – FR-M6-08 |
| `Documents` component | Table with name, size, type, uploader and date; "Görüntüle" opens a blob in a new tab, "İndir" saves it under the original name (the token is sent, so files are fetched as blobs). | FR-M6-04 – FR-M6-06 |

### M7 – Weekly statistics

| Component | Responsibility | Requirements |
|---|---|---|
| `weeklyStats(db, childId, week)` | Groups the tasks due in the week by area; returns total, done and rate (rounded %) overall and for every area, with zeros for empty areas. Computed on request, not stored. | FR-M7-01, FR-M7-02, FR-M7-05 |
| `GET /stats?week=` | Parent and specialist only. | FR-M7-01 |
| `Stats`, `WeekGlance` | Ring with the total rate and one bar per area; overview tiles above the tabs (rate, open tasks, number of events and the next event). The overview hides itself if it cannot load. | FR-M7-01, FR-M7-02, FR-M7-06 |

### M8 – Role-based AI summary

| Component | Responsibility | Requirements |
|---|---|---|
| `POST /ai-summary` (`routes/aiSummary.js`) | Parent and specialist only. Collects the week's entries, events and tasks of this child, numbers them `[1]…[n]` and returns `{ label: "AI-generated", role, weekStart, weekEnd, provider, summary, sources }`. With no records it returns a fixed message and no sources without calling the AI. A provider error becomes 502. | FR-M8-01 – FR-M8-05, FR-M8-07, FR-M8-11 |
| `aiPrompts.js` | Separate system prompts for the parent (plain, warm) and the specialist (concise, by area). Shared rules: Turkish, only the numbered records, cite as [n], no diagnosis, treatment, medication, therapy or decision, under 180 words. The user prompt holds the child's name, the week, the completion rate and the records — no e-mails or hashes. | FR-M8-01, FR-M8-02, FR-M8-10, NFR-02 |
| `aiService.js` – `generateSummary` | `mock`: deterministic text that follows the same rules and never touches the network. `gemini` / `github`: one HTTP call each; missing credentials, HTTP errors and empty answers throw. | FR-M8-06, FR-M8-07 |
| `POST /ai-summary/feedback`, `ai_feedback` table | Stores `helpful` or `incorrect` with child, user, role and week start (201). | FR-M8-08 |
| `AiSummary` component | Notice that the AI does not decide; "Özet oluştur" button; result with "AI-generated" badge, citations linked to the "Dayanak kayıtlar" list, and the two rating buttons (disabled after one rating). | FR-M8-03, FR-M8-04, FR-M8-08, FR-M8-09 |

---

## 3. Data Model

The schema is in `backend/src/db.js`. Dates are stored as ISO 8601 text (`YYYY-MM-DD` for days, `YYYY-MM-DDTHH:MM` for event times, full ISO timestamps for created/edited/done times). All child-owned tables use `ON DELETE CASCADE` on `child_id`.

```mermaid
erDiagram
    USERS ||--o{ CHILDREN : "is parent of (parent_id)"
    USERS |o--o| CHILDREN : "logs in as (user_id)"
    CHILDREN ||--o{ LINKS : has
    USERS ||--o{ LINKS : "specialist in"
    CHILDREN ||--o{ EVENTS : has
    CHILDREN ||--o{ TASKS : has
    CHILDREN ||--o{ ENTRIES : has
    CHILDREN ||--o{ DOCUMENTS : has
    CHILDREN ||--o{ AI_FEEDBACK : has
    USERS ||--o{ EVENTS : "created_by"
    USERS ||--o{ TASKS : "assigned_by"
    USERS ||--o{ ENTRIES : "author_id"
    USERS ||--o{ DOCUMENTS : "uploader_id"
    USERS ||--o{ AI_FEEDBACK : "user_id"

    USERS {
        int id PK
        text email "UNIQUE, NOCASE"
        text password_hash "bcrypt"
        text name
        text role "parent | specialist | child"
        text specialty "specialists only"
    }
    CHILDREN {
        int id PK
        text name
        text grade
        int parent_id FK
        int user_id FK "UNIQUE, child's login"
    }
    LINKS {
        int id PK
        int child_id FK
        int specialist_id FK
        text specialty
        text created_at
    }
    EVENTS {
        int id PK
        int child_id FK
        text title
        text starts_at
        text ends_at "nullable"
        text area
        int created_by FK
    }
    TASKS {
        int id PK
        int child_id FK
        text title
        text description
        text area
        text due_date
        text status "todo | done"
        text done_at "nullable"
        int assigned_by FK
        text created_at
    }
    ENTRIES {
        int id PK
        int child_id FK
        int author_id FK
        text entry_date
        text title
        text body
        text area
        int edited "0 | 1"
        text edited_at "nullable"
        text created_at
    }
    DOCUMENTS {
        int id PK
        int child_id FK
        int uploader_id FK
        text original_name
        text mime_type
        int size
        text stored_name "uuid + extension"
        text doc_type
        text created_at
    }
    AI_FEEDBACK {
        int id PK
        int child_id FK
        int user_id FK
        text role
        text week_start
        text rating "helpful | incorrect"
        text created_at
    }
```

`links` has a unique constraint on (child_id, specialist_id). Indexes: events (child_id, starts_at), tasks (child_id, due_date), entries (child_id, entry_date), documents (child_id). The database checks only `users.role`, `tasks.status` and `ai_feedback.rating`; area, specialty and doc_type are checked by the routes against `constants.js`. AI summaries are not stored.

---

## 4. API / Interfaces

All endpoints are JSON over HTTP under `/api`. Every route below `/api/children` needs `Authorization: Bearer <token>` (401 without it). Every `/api/children/:childId/...` route runs `childAccess`; the **Roles** in each row are the only ones allowed, everyone else gets 403. `week` is any `YYYY-MM-DD` inside the week (default: current week). Errors are `{ "error": "<Turkish message>" }`.

| Method | Endpoint | Description | Module |
|---|---|---|---|
| GET | `/api/health` | `{ status: "ok" }`. No login. | Shared |
| POST | `/api/auth/login` | Body `{ email, password }` → `{ token, user }`. 400 empty field, 401 wrong e-mail or password. | M1 |
| GET | `/api/auth/me` | Current user. | M1 |
| GET | `/api/children` | Children the caller may use. | M2 |
| GET | `/api/children/:childId` | `{ child, role }`. Roles: parent, specialist, child. | M2 |
| GET | `/api/children/:childId/links` | Linked specialists. Roles: parent. | M2 |
| POST | `/api/children/:childId/links` | Body `{ email, specialty? }` → 201. 404 unknown specialist, 409 already linked. Roles: parent. | M2 |
| DELETE | `/api/children/:childId/links/:specialistId` | 204, or 404 if not linked. Roles: parent. | M2 |
| GET | `/api/children/:childId/events?week=` | `{ weekStart, weekEnd, events }`. Roles: parent, specialist, child. | M3 |
| POST | `/api/children/:childId/events` | Body `{ title, startsAt, endsAt?, area }` → 201. Roles: parent, specialist. | M3 |
| GET | `/api/children/:childId/tasks?week=` | Tasks (all, or due in the week) with `assignerName`. Roles: parent, specialist, child. | M4 |
| POST | `/api/children/:childId/tasks` | Body `{ title, description?, area, dueDate }` → 201. Roles: parent, specialist. | M4 |
| PATCH | `/api/children/:childId/tasks/:taskId/done` | Marks done, sets `doneAt`. Roles: child. | M4 |
| GET | `/api/children/:childId/entries` | Newest first. Roles: parent, specialist. | M5 |
| POST | `/api/children/:childId/entries` | Body `{ entryDate, title, body, area }` → 201. Roles: specialist. | M5 |
| PUT | `/api/children/:childId/entries/:entryId` | Same body; author only (403 otherwise). Sets `edited`, `editedAt`. Roles: specialist. | M5 |
| GET | `/api/children/:childId/documents` | Metadata, newest first. Roles: parent, specialist. | M6 |
| POST | `/api/children/:childId/documents` | Multipart `file` + `docType` → 201. 400 wrong type or no file, 413 over 10 MB. Roles: parent, specialist. | M6 |
| GET | `/api/children/:childId/documents/:docId/download[?inline=1]` | The file under its original name. Roles: parent, specialist. | M6 |
| GET | `/api/children/:childId/stats?week=` | `{ stats: { total, done, rate, byArea[] } }`. Roles: parent, specialist. | M7 |
| POST | `/api/children/:childId/ai-summary` | Body `{ week }` → summary and sources. 502 if the provider fails. Roles: parent, specialist. | M8 |
| POST | `/api/children/:childId/ai-summary/feedback` | Body `{ week, rating }` → 201. Roles: parent, specialist. | M8 |

---

## 5. Critical Flows

The same three flows as SRS Section 4.

### Flow 1: Log in and open the role's home screen

**Requirements:** FR-M1-01 – FR-M1-05, FR-M1-07 – FR-M1-10, FR-M2-05, FR-M2-09

```mermaid
sequenceDiagram
    actor User
    participant SPA as React SPA
    participant API as Express API
    participant DB as SQLite
    User->>SPA: Enter e-mail and password, press "Giriş yap"
    SPA->>API: POST /api/auth/login {email, password}
    API->>DB: SELECT * FROM users WHERE email = ? (NOCASE)
    DB-->>API: user or nothing
    API->>API: bcrypt.compare (dummy hash if no user)
    alt wrong e-mail or password
        API-->>SPA: 401 {error: "E-posta veya şifre hatalı."}
        SPA-->>User: Same error in both cases
    else correct
        API-->>SPA: 200 {token (JWT, 8 h), user {id, name, role}}
        SPA->>SPA: Store token in localStorage
        alt role = child
            SPA-->>User: /my (own tasks and schedule)
        else parent or specialist
            SPA->>API: GET /api/children (Bearer token)
            API->>API: authenticate: verify JWT, load user
            API->>DB: children by parent_id or by links
            DB-->>API: rows
            API-->>SPA: {children}
            SPA-->>User: Children list (a parent with one child goes straight to the workspace)
        end
    end
    Note over SPA,API: Any later 401 clears the token and shows the login page
```

### Flow 2: Assign a task and complete it as the child

**Requirements:** FR-M2-06, FR-M4-01 – FR-M4-07

```mermaid
sequenceDiagram
    actor S as Specialist
    actor C as Child
    participant SPA as React SPA
    participant API as Express API
    participant DB as SQLite
    S->>SPA: Fill "Görev ver" and press "Görevi ver"
    SPA->>API: POST /api/children/1/tasks {title, description, area, dueDate}
    API->>DB: childAccess: is the specialist linked? (links)
    alt not linked
        API-->>SPA: 403
    else invalid field
        API-->>SPA: 400 {error naming the field}
        SPA-->>S: Error under the form
    else valid
        API->>DB: INSERT INTO tasks (status = 'todo')
        API-->>SPA: 201 {task}
        SPA-->>S: Task listed as "Bekliyor", toast "Görev verildi"
    end
    C->>SPA: Open /my, press "Yaptım!"
    SPA->>API: PATCH /api/children/1/tasks/7/done
    API->>DB: childAccess: children.user_id = caller? (only 'child' allowed)
    API->>DB: UPDATE tasks SET status = 'done', done_at = now (if not done yet)
    API-->>SPA: 200 {task}
    SPA-->>C: "Tamamlandı"
    S->>SPA: Reload tasks or statistics
    SPA->>API: GET /tasks?week=… and /stats?week=…
    API-->>SPA: New status and completion rate
    Note over API: PATCH …/done by a parent or specialist → 403
```

### Flow 3: View and rate the weekly AI summary

**Requirements:** FR-M2-06, FR-M8-01 – FR-M8-11

```mermaid
sequenceDiagram
    actor U as Parent or linked specialist
    participant SPA as React SPA
    participant API as Express API
    participant DB as SQLite
    participant AI as aiService
    participant LLM as Gemini / GitHub Models
    U->>SPA: "AI özeti" tab, press "Özet oluştur"
    SPA->>API: POST /api/children/1/ai-summary {week}
    API->>DB: childAccess (parent or specialist only)
    API->>DB: entries, events, tasks of the week
    DB-->>API: records, numbered [1]…[n]
    alt no records
        API-->>SPA: 200 {summary: "Bu hafta için özetlenecek kayıt bulunamadı.", sources: []}
    else records found
        API->>DB: weeklyStats
        API->>AI: generateSummary(role, child name, week, records, stats)
        alt AI_PROVIDER = mock
            AI-->>API: deterministic text with [n] citations
        else gemini or github
            AI->>LLM: role system prompt + records (no e-mails, no hashes)
            alt provider answers
                LLM-->>AI: text
                AI-->>API: text
            else error or empty answer
                LLM-->>AI: error
                AI-->>API: throws
                API-->>SPA: 502 {error}
                SPA-->>U: Error message, other tabs keep working
            end
        end
        API-->>SPA: 200 {label "AI-generated", role, summary, sources}
        SPA-->>U: Summary, citations linked to "Dayanak kayıtlar", rating buttons
    end
    U->>SPA: "Faydalı" or "Hatalı bilgi bildir"
    SPA->>API: POST /api/children/1/ai-summary/feedback {week, rating}
    API->>DB: INSERT INTO ai_feedback (child, user, role, week_start, rating)
    API-->>SPA: 201
    SPA-->>U: "Geri bildiriminiz için teşekkürler."
```

---

## 6. User Interface

Screenshots of the running application (backend and Vite dev server, seeded demo data, headless Chrome at 1280 px width) taken on 2026-11-15. The week shown is 9–15 Nov 2026. Three small synthetic documents were uploaded and one entry was edited before the screenshots, so those lists are not empty.

| Screen | Image | Module |
|---|---|---|
| Login page with demo account buttons | ![Login](img/ui-m1-login.png) | M1 |
| Login with a wrong password (generic error) | ![Login error](img/ui-m1-login-error.png) | M1 |
| Specialist's children list (Elif Arslan, linked to two children) | ![Children list](img/ui-m2-children-specialist.png) | M2 |
| Linked specialists with the link form (parent) | ![Linked specialists](img/ui-m2-links.png) | M2 |
| Unlink confirmation | ![Unlink confirmation](img/ui-m2-unlink-confirm.png) | M2 |
| Weekly schedule with the add-event form and the week overview (parent) | ![Weekly schedule](img/ui-m3-schedule.png) | M3, M7 |
| Task list and assign form (parent) | ![Tasks, parent](img/ui-m4-tasks-parent.png) | M4 |
| Task list with the "Verdiklerim" filter (specialist Murat Kaya) | ![Tasks, specialist](img/ui-m4-tasks-specialist.png) | M4 |
| Child home with "Yaptım!" buttons and own schedule | ![Child home](img/ui-m4-child-home.png) | M3, M4 |
| Specialist entries, read-only (parent) | ![Entries, parent](img/ui-m5-entries-parent.png) | M5 |
| Specialist entries with "Düzenlendi" badge, edit button and entry form (author) | ![Entries, specialist](img/ui-m5-entries-specialist.png) | M5 |
| Documents table and upload form | ![Documents](img/ui-m6-documents.png) | M6 |
| Weekly statistics | ![Statistics](img/ui-m7-stats.png) | M7 |
| AI summary, parent version, after rating | ![AI summary, parent](img/ui-m8-ai-summary-parent.png) | M8 |
| AI summary, specialist version (grouped by area) | ![AI summary, specialist](img/ui-m8-ai-summary-specialist.png) | M8 |

The first version's low-fidelity wireframes (`img/wireframe-*.png`) are kept for comparison. The built screens follow them, with two differences: the parent's tabs include documents, statistics and linked specialists in one workspace, and the AI summary is generated with a button instead of loading on its own.

---

## 7. Change Log

| Date | Change | By |
|---|---|---|
| 2026-10-25 | First version: architecture, technology stack, module design for M1–M8 with implementation status, data model from db.js, implemented and planned API, sequence diagrams for the three critical flows, UI screen list (CST-22). | Ceren Gökdere |
| 2026-10-25 | Aligned with the instructor's SDD template. Marked endpoints and components with no Jira task as proposed. Fixed the error branch of the Flow 3 diagram. Corrected the data-model notes. | Ceren Gökdere |
| 2026-10-25 | Added the status page screenshot and proposed wireframes to Section 6. | Ceren Gökdere |
| 2026-11-01 | Converted from Word (docs/SDD.docx) to Markdown. | Aytuğ Saygı |
| 2026-11-15 | Final version, updated to the code on `main` after M1–M8 were merged (PR #8). Removed the Planned/Proposed labels and described the built components with file names. Added the chosen libraries (jsonwebtoken, multer, React Router, framer-motion). Replaced the planned API with the real endpoints and roles (e.g. `POST /ai-summary`, `PATCH /tasks/:id/done`, unlink by specialist id, 400 instead of 415 for a wrong file type). Redrew the architecture, data model and three sequence diagrams in Mermaid to match the code (the old PNG diagrams were removed). Replaced the status page screenshot with 15 screenshots of the running application (CST-27). | Ceren Gökdere |
