# Gelişim Ağı – AI-Assisted Child Development Platform

SENG 383 – Software Project III, Fall 2026 · Team **Core Stack**

A web platform where a child's parent, specialists and the child share one schedule, one task list and one record of
observations, with an AI summary for each role that supports decisions and never makes them.

| Part | Technology |
|---|---|
| Frontend | React 18 (Vite) |
| Backend | Node.js + Express |
| Tests | Jest + Supertest (backend), Vitest + Testing Library (frontend) |
| CI | GitHub Actions |

JWT authentication, the AI module and Playwright end-to-end tests are added with the modules (see the Jira board).
SQLite is in place: the schema has every table, and the seed script fills only demo users and children.

## Current state: walking skeleton (v0.0) and the database

The frontend calls the backend's `GET /api/health` through the Vite proxy and shows whether it answers. Every layer
(browser → React → Vite proxy → Express) and the CI pipeline are wired up; the features M1–M8 are built on top of this.
`npm run seed` resets `backend/data/app.db` with synthetic accounts (password `Password123!`) and two child records.
Links, schedule, tasks, entries, documents and AI feedback stay empty until those modules are merged.

## Requirements

* **Node.js 22 or newer** (`node --version`) and npm

## Install and run

From the repository root:

```bash
npm run install:all      # install backend and frontend dependencies
npm run seed             # create the SQLite file with synthetic users and children
npm run dev:backend      # terminal 1: backend on http://localhost:3001
npm run dev:frontend     # terminal 2: frontend on http://localhost:5173
```

Open <http://localhost:5173>: the page should say **"Backend çalışıyor"**.

## Tests

```bash
npm test                 # backend and frontend tests
npm run test:coverage    # the same, with coverage
npm run build            # production build of the frontend
```

## How we work

* Work is planned and tracked in Jira (project key **CST**).
* Every change goes through a branch and a reviewed pull request; branch names, commit messages and PR titles start with
  the Jira key, e.g. `CST-21 Add walking skeleton`.
* CI (`.github/workflows/ci.yml`) runs the backend and frontend tests and the build on every push to `main` and on every
  pull request.

## Documents

* [Project Management Plan](docs/PMP.md)
* [Jira plan](docs/JIRA_PLAN.md)
* [Weekly meeting notes](docs/meetings/)
