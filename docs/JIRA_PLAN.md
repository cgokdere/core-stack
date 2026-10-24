# Jira plan

Jira is the place for plans and tasks; this file is the source for the numbers in `docs/PMP.md`.
The CST board already has these 14 epics and 41 tasks. Keys below are the keys on that board.

## Setup (done once by the team contact person)

1. Create a free Jira Cloud site with a university e-mail.
2. Create a **Scrum** project. **Done:** the project is `Core Stack Team` with key **`CST`** on
   `https://core-stack-seng383.atlassian.net` (commits and branches start with the key, e.g.
   `CST-16 Add work packages and sprint plan`, branch `CST-16-work-packages-sprint-plan`).
3. Invite all team members.
4. Create the **14 epics** below with exactly these names.
5. Install **GitHub for Jira** and link the team repository.
6. Add the board link to `docs/PMP.md` (PMP-1) and to the Team Information Form.

## Epics

| Epic | Type | Content |
|---|---|---|
| PMP-1 | Documentation | Project, Jira setup, team and roles |
| PMP-2 | Documentation | Work packages (epics) and sprint plan |
| PMP-3 | Documentation | Progress review: mid-term (v0.1) |
| PMP-4 | Documentation | Progress review: v0.2 |
| PMP-5 | Documentation | Progress review: final (v1.0) |
| PMP-6 | Documentation | Retrospective |
| M1 | Development | Login and roles |
| M2 | Development | Linking specialists |
| M3 | Development | Weekly schedule |
| M4 | Development | Tasks |
| M5 | Development | Specialist entries |
| M6 | Development | Documents |
| M7 | Development | Weekly statistics |
| M8 | Development | Role-based AI summary |

SRS and design-document work is kept as tasks under M1 (the guide allows this).

## Assignees

Every task belongs to one epic, has one assignee and a short title in the form `<epic> – <what>`.
The 41 tasks are split **14 / 14 / 13**. Everybody works on both frontend and backend, and everybody reviews at least one pull request per sprint.

| Member | Tasks | Count |
|---|---|---|
| Aytuğ Saygı | CST-15, 19, 20, 21, 24, 25, 26, 27, 28, 29, 40, 41, 42, 43 | 14 |
| Elif İstanbulluoğlu | CST-16, 23, 30, 31, 32, 33, 34, 35, 44, 45, 46, 47, 54, 55 | 14 |
| Ceren Gökdere | CST-17, 18, 22, 36, 37, 38, 39, 48, 49, 50, 51, 52, 53 | 13 |

## Tasks per epic

| Epic | Tasks | Count |
|---|---|---|
| PMP-1 | PMP-1 – Project, Jira setup, team and roles (CST-15, Aytuğ Saygı, Sprint 1) | 1 |
| PMP-2 | PMP-2 – Work packages and sprint plan (CST-16, Elif İstanbulluoğlu, Sprint 1) | 1 |
| PMP-3 | PMP-3 – Progress review v0.1, with board screenshot (CST-17, Ceren Gökdere, Sprint 2) | 1 |
| PMP-4 | PMP-4 – Progress review v0.2, with board screenshot (CST-18, Ceren Gökdere, Sprint 3) | 1 |
| PMP-5 | PMP-5 – Progress review v1.0, with board screenshot (CST-19, Aytuğ Saygı, Sprint 4) | 1 |
| PMP-6 | PMP-6 – Retrospective (CST-20, Aytuğ Saygı, Sprint 4) | 1 |
| M1 | M1 – Walking skeleton (CST-21, Aytuğ Saygı, Sprint 1) · M1 – SRS and SDD first version (CST-22, Ceren Gökdere, Sprint 1) · M1 – Database schema and seed script (CST-23, Elif İstanbulluoğlu, Sprint 1) · M1 – Auth API: login, JWT, role middleware (CST-24, Aytuğ Saygı, Sprint 2) · M1 – Login page and role-based routes (CST-25, Aytuğ Saygı, Sprint 2) · M1 – End-to-end test: login and roles (CST-26, Aytuğ Saygı, Sprint 2) · M1 – SRS and SDD final (CST-27, Aytuğ Saygı, Sprint 1) | 7 |
| M2 | M2 – Links API: link, unlink, list (CST-28, Aytuğ Saygı, Sprint 2) · M2 – Access check for linked specialists on every child route (CST-29, Aytuğ Saygı, Sprint 2) · M2 – Linked-specialists page with unlink confirmation (CST-30, Elif İstanbulluoğlu, Sprint 2) · M2 – End-to-end test: linking flow (CST-31, Elif İstanbulluoğlu, Sprint 2) | 4 |
| M3 | M3 – Events API with week filter (CST-32, Elif İstanbulluoğlu, Sprint 2) · M3 – Weekly schedule view (CST-33, Elif İstanbulluoğlu, Sprint 2) · M3 – Add-event form (CST-34, Elif İstanbulluoğlu, Sprint 2) · M3 – End-to-end test: weekly schedule (CST-35, Elif İstanbulluoğlu, Sprint 2) | 4 |
| M4 | M4 – Tasks API (CST-36, Ceren Gökdere, Sprint 2) · M4 – Task list and assign form (CST-37, Ceren Gökdere, Sprint 2) · M4 – Child "done" action (CST-38, Ceren Gökdere, Sprint 2) · M4 – End-to-end test: assign and complete a task (CST-39, Ceren Gökdere, Sprint 2) | 4 |
| M5 | M5 – Entries API with "edited" mark (CST-40, Aytuğ Saygı, Sprint 3) · M5 – Entries tab and form (CST-41, Aytuğ Saygı, Sprint 3) · M5 – Edit own entry (CST-42, Aytuğ Saygı, Sprint 3) · M5 – End-to-end test: entries (CST-43, Aytuğ Saygı, Sprint 3) | 4 |
| M6 | M6 – Documents API with upload checks (CST-44, Elif İstanbulluoğlu, Sprint 3) · M6 – Documents tab (CST-45, Elif İstanbulluoğlu, Sprint 3) · M6 – View and download (CST-46, Elif İstanbulluoğlu, Sprint 3) · M6 – End-to-end test: documents (CST-47, Elif İstanbulluoğlu, Sprint 3) | 4 |
| M7 | M7 – Statistics service and API (CST-48, Ceren Gökdere, Sprint 3) · M7 – Statistics tab (CST-49, Ceren Gökdere, Sprint 3) · M7 – End-to-end test: statistics (CST-50, Ceren Gökdere, Sprint 3) | 3 |
| M8 | M8 – AI service module with mock mode (CST-51, Ceren Gökdere, Sprint 3) · M8 – Parent and specialist prompts (CST-52, Ceren Gökdere, Sprint 3) · M8 – AI summary API with sources (CST-53, Ceren Gökdere, Sprint 3) · M8 – AI summary UI (CST-54, Elif İstanbulluoğlu, Sprint 3) · M8 – End-to-end test: AI summary (CST-55, Elif İstanbulluoğlu, Sprint 3) | 5 |
| **Total** | | **41** |

CST-27 (SRS and SDD final) sits in Sprint 1, Week 6. An earlier draft of this list had placed it in Sprint 3, with the final documents in Week 10. The assignment requires those documents in Week 6, so the sprint on the card should be Sprint 1.

## Sprints

Week 4 starts on Monday 19 October 2026.

| Sprint | Weeks | Dates | Goal | Ends with |
|---|---|---|---|---|
| Sprint 1 | 4–6 | 19 Oct – 8 Nov | Jira and repository set up, PMP-1 and PMP-2, SRS draft (Week 4) then SRS/SDD final (Week 6), database schema and seed, walking skeleton | `v0.0` in Week 5 (1 Nov); SRS and design document final in Week 6 (8 Nov) |
| Sprint 2 | 7–8 | 9–22 Nov | M1–M4 working end to end, first end-to-end test in CI, PMP-3 in Week 7 | Release `v0.1`, Grup 1 mid-term demo, Week 8 |
| Sprint 3 | 9–10 | 23 Nov – 6 Dec | M5–M8, PMP-4 in Week 9, branch coverage at least 40%, end-to-end tests for the 3 critical flows | Release `v0.2`, Week 10 |
| Sprint 4 | 11–13 | 7–27 Dec | Stabilise, PMP-5 in Week 11, branch coverage at least 60%, one end-to-end test per M1–M8, final report, PMP-6 in Week 12 | Release `v1.0` in Week 12; Grup 1 presentation in Week 13 |

Sprint 1 has work for all three members (Aytuğ 3 tasks, Elif 2, Ceren 1). Sprint 2 has Aytuğ 5, Elif 6, Ceren 5. Sprint 3 has Aytuğ 4, Elif 6, Ceren 7. Sprint 4 has the two remaining documentation tasks (both Aytuğ). Stabilisation and defects found in Sprint 4 are new cards, opened under the epic they belong to, so Elif and Ceren still take review and fix work in that sprint.

Rules for the board: To Do → In Progress → Done; a task is Done only when its work is merged into `main` through a reviewed pull request. Commit messages and branch names start with the Jira key.
