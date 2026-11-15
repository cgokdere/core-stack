# Project Management Plan (PMP)

**Team name:** CoreStack (Group G1, Section-1)  
**Last updated:** 2026-11-15

Each section is one Jira epic (PMP-1 … PMP-6); the epic is marked Done when the section is complete. The task list behind the numbers is in [JIRA_PLAN.md](JIRA_PLAN.md). Screenshots are in `docs/img/`.

| Section | Content | Required by | Status |
|---|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Week 6 | Done |
| PMP-2 | Work packages (epics) and sprint plan | Week 6 | Done |
| PMP-3 | Progress review: mid-term (v0.1) | Mid-term evaluation (Week 8 / 9) | In progress (status of 2026-11-15) |
| PMP-4 | Progress review: v0.2 | Week 10 | Not started |
| PMP-5 | Progress review: final (v1.0) | Final evaluation | Not started |
| PMP-6 | Retrospective | Final evaluation | Not started |

---

## PMP-1. Project and Team

### Project and Jira Setup

**Project in one sentence:** A web-based decision support platform that brings a child's parent, specialists and the child together around one shared schedule, task list and record of observations, with an AI summary for each role that supports decisions and never makes them.  
**Jira project key:** CST  
**Jira board link:** <https://core-stack-seng383.atlassian.net/jira/software/projects/CST/boards/2>

### Team and Roles

| Name | Jira / GitHub username | Role |
|---|---|---|
| Aytuğ Saygı | AYTUĞ SAYGI / aytugsaygi | Developer, tester |
| Ceren Gökdere | Ceren Gökdere / cgokdere | Developer |
| Elif İstanbulluoğlu | Elif İstanbulluoğlu / elif-istanbulluoglu | Developer, project manager |

The team has no SENG 440 test and quality students; testing is done by the team (tester: Aytuğ Saygı). All three members are developers and work on both frontend and backend; the Jira tasks are split between them as evenly as possible (14 / 14 / 13).

---

## PMP-2. Plan

The CST board has 14 epics (PMP-1 … PMP-6 and M1 … M8) and 41 tasks. Week 4 starts on Monday 19 October 2026. Where the Term Project Assignment and the course schedule posted on 12 October 2026 differ, the assignment applies.

### Work Packages (Epics)

| Epic | Owner | Number of tasks | Planned sprint(s) |
|---|---|---|---|
| M1 – Login and roles | Aytuğ Saygı | 7 | Sprint 1, Sprint 2 |
| M2 – Linking specialists | Aytuğ Saygı (API), Elif İstanbulluoğlu (page) | 4 | Sprint 2 |
| M3 – Weekly schedule | Elif İstanbulluoğlu | 4 | Sprint 2 |
| M4 – Tasks | Ceren Gökdere | 4 | Sprint 2 |
| M5 – Specialist entries | Aytuğ Saygı | 4 | Sprint 3 |
| M6 – Documents | Elif İstanbulluoğlu | 4 | Sprint 3 |
| M7 – Weekly statistics | Ceren Gökdere | 3 | Sprint 3 |
| M8 – Role-based AI summary | Ceren Gökdere (service), Elif İstanbulluoğlu (UI) | 5 | Sprint 3 |

The six documentation epics have one task each: PMP-1 (Aytuğ Saygı, Sprint 1), PMP-2 (Elif İstanbulluoğlu, Sprint 1), PMP-3 (Ceren Gökdere, Sprint 2), PMP-4 (Ceren Gökdere, Sprint 3), PMP-5 and PMP-6 (Aytuğ Saygı, Sprint 4). M1 also holds the SRS/SDD tasks (CST-22, CST-27) and the database schema task (CST-23); the epic owner is the member with the most tasks in that epic.

### Sprint Plan

| Sprint | Weeks | Sprint goal | Ends with |
|---|---|---|---|
| Sprint 1 | 4–6 (19 Oct – 8 Nov) | Jira and repository set up, PMP-1 and PMP-2, SRS and SDD first version, database schema and seed, walking skeleton | Walking skeleton (v0.0), Week 6 |
| Sprint 2 | 7–8 (9 – 22 Nov) | M1–M4 working end to end, first end-to-end test in CI, SRS and SDD final, PMP-3 | Release v0.1, mid-term |
| Sprint 3 | 9–10 (23 Nov – 6 Dec) | M5–M8, branch coverage at least 40%, end-to-end tests for the 3 critical flows, PMP-4 | Release v0.2, Week 10 |
| Sprint 4 | 11–13 (7 – 27 Dec) | Stabilise, branch coverage at least 60%, one end-to-end test per M1–M8, PMP-5, PMP-6, final report | Release v1.0, final |

---

## PMP-3. Progress Review: Mid-term (v0.1)

Status on 2026-11-15 (end of Week 7, middle of Sprint 2), taken from what is merged on `main`. A Jira card counts as Done only when its work is merged through a reviewed pull request.

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 | Walking skeleton (CST-21), SRS/SDD first version (CST-22), schema and seed (CST-23), auth API (CST-24), login page and role-based routes (CST-25), end-to-end test (CST-26), SRS/SDD final (CST-27) | In progress: CST-21 – CST-25 Done; CST-27 updated to the final code on 2026-11-15; CST-26 Not started |
| M2 | Links API (CST-28), access check (CST-29), linked-specialists page (CST-30), end-to-end test (CST-31) | In progress: CST-28 – CST-30 Done; CST-31 Not started |
| M3 | Events API (CST-32), weekly schedule view (CST-33), add-event form (CST-34), end-to-end test (CST-35) | In progress: CST-32 – CST-34 Done; CST-35 Not started |
| M4 | Tasks API (CST-36), task list and assign form (CST-37), child "done" action (CST-38), end-to-end test (CST-39) | In progress: CST-36 – CST-38 Done; CST-39 Not started |
| M5 – M8 | Planned for Sprint 3 | Implementation Done ahead of plan (CST-40 – 42, 44 – 46, 48 – 49, 51 – 54); end-to-end tests (CST-43, 47, 50, 55) Not started |
| PMP-1, PMP-2 | Sections written | Done |

Measured on 2026-11-15: 83 backend tests and 76 frontend tests pass in CI; branch coverage is 94.2% (backend) and 94.2% (frontend), already above the v0.2 and v1.0 targets. Release tag `v0.0` exists; `v0.1` is not tagged yet.

Each module was developed and committed separately under its own Jira key (CST-24, CST-28, CST-32, CST-36, CST-40, CST-44, CST-48, CST-51) and merged into `main` through pull request #8 on 2026-11-15.

**Changes to the plan:**

- **M5–M8 are a sprint early.** Sprint 3 can therefore focus on the end-to-end tests, the open requirement gaps and stabilising.
- **End-to-end tests are behind.** No Playwright test exists yet; the first one (CST-26, login and roles) is still due before v0.1 at the end of Week 8.
- **Scope change in M7.** Event and entry counts per area (FR-M7-03, FR-M7-04) were not built and are now Could. A week overview (FR-M7-06) was added instead.
- **Open gaps** for Sprint 3: show the edit time of an edited entry (FR-M5-05) and add a timeout for external AI providers (FR-M8-07).

---

## PMP-4. Progress Review: v0.2

**Jira board screenshot:** (to be added in Week 10 as `docs/img/pmp-4-jira-board.png`)

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 – M4 | End-to-end tests CST-26, CST-31, CST-35, CST-39 | |
| M5 – M8 | Features (done early), end-to-end tests CST-43, CST-47, CST-50, CST-55 | |
| All | Branch coverage at least 40%, end-to-end tests for the 3 critical flows, release v0.2 | |

**Changes to the plan (if any):**

---

## PMP-5. Progress Review: Final (v1.0)

**Jira board screenshot:** (to be added at the final evaluation as `docs/img/pmp-5-jira-board.png`)

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 – M8 | All Must requirements, one end-to-end test per module, defects found in Sprint 4 closed | |
| All | Branch coverage at least 60%, release v1.0, final report | |

**Changes to the plan (if any):**

---

## PMP-6. Retrospective

- What worked well in using Jira:
- What we would do differently:
