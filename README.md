# Folio — People & work

A responsive HR management starter built with React 19, TypeScript, Vite, and Lucide icons. No API keys or services are required. All supplied people and records are fictional.

## Run locally

Install Node.js **24 LTS** (the tested environment is 24.19). Open a terminal in this folder:

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally http://127.0.0.1:5173. Stop with Ctrl+C.

```sh
npm test          # Built-in Node test runner: workflow and permission tests
npm run build    # TypeScript check + production build into dist/
npm run preview  # Serve the production build locally
```

Deploy `dist/` to a static host. The app uses internal navigation state and needs no special route rewriting. Each origin/browser has separate demo data. The bundled `.openai/hosting.json` identifies the private Sites deployment created for this starter; remove that identity before registering an independent Site.

## Functional features

| Area               | Implemented starter behavior                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview           | Record-driven metrics, candidate/review charts, upcoming interview list, people, learning progress, quick navigation                                                                                                         |
| People             | Directory, create/edit profiles, department and status tracking                                                                                                                                                              |
| Recruitment        | Candidate forms, source and notes, list/pipeline views, search, filters, pagination, status changes, automatic employee creation when hired                                                                                  |
| Interviews         | Scheduling, candidate links, interviewer, format, date/time, overlapping 60-minute slot detection for the candidate/interviewer, cancellation, evaluation ratings and feedback                                               |
| Learning           | Assign an employee, skill category, development goal, target date, progress; status follows progress automatically                                                                                                           |
| Payroll            | Fictional USD base/bonus and configurable percentage deduction, rounded gross/deduction/net, benefits notes, Draft → Reviewed → Approved tracking; approval requires a previously saved Reviewed record and locks the record |
| Employee relations | Fictional case summary, owner, priority and status; resolution required for Resolved                                                                                                                                         |
| Performance        | Employee, cycle, reviewer, goal, rating and feedback; completed reviews require a whole-number rating from 1–5 and feedback                                                                                                  |
| Workspace          | Browser persistence, local activity log, export of visible records to JSON, reset with confirmation, role preview and demo guide                                                                                             |

Open a row using its arrow to edit it. Changes update the dashboard and persist after refreshing. Use Settings & privacy to switch demo roles or restore the examples. Approved payroll records are locked; create a new period for a new record. Hiring creates an employee once; changing the candidate back later does not delete the employee. Interview times use Asia/Tashkent (UTC+5) in this single-timezone starter; no timezone conversion is performed. The dashboard uses November 2, 2026 as its explicitly labeled demo scenario, independent of the real current date.

## Demo role behavior

| Role           | Visibility and editing                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HR admin       | All modules; create and edit all records; activity log; reset                                                                                                                    |
| Hiring manager | Engineering candidates, interviews, people, learning and reviews; can edit recruitment, interviews, learning and reviews; people directory is read-only; no payroll or relations |
| Employee       | Alex Morgan's profile, learning assignments and reviews; read-only                                                                                                               |

The role guards also run inside the local mutation function and exports use visible records only. These are useful examples of application rules, **not enforceable security**. A user controls the browser and can inspect the JavaScript, localStorage, and bundled sample data. All example data ships in the client. Role selection resets to HR admin when the app reloads.

## What is mock or not connected

- No sign-in, session management, backend, protected database, multi-user synchronization, encryption, or immutable audit trail.
- No real payroll, tax calculation, legal compliance, payment processing, bank files, payslips, benefits enrollment, or financial integrations. The percentage deduction is arbitrary, **not a jurisdiction's tax rule**. “Approved” is only a demo status.
- No email delivery, calendar sync, meeting links, CV uploads, course content, learning-provider integration, or review notifications.
- Benefits are text notes. Learning is progress tracking. Ratings and evaluation notes are entered by the demo user; no automated employment decisions occur.
- The “Acme Studio” organization and all people/records are fictional. Example emails use the reserved `.test` domain.
- Browser storage is best-effort and unencrypted. Clearing it deletes changes; another person using the same browser can see them. If storage fails, the app warns that changes are session-only. JSON exports are plain text.
- No deletion is exposed per record; use statuses to archive/cancel, or reset the entire sample workspace. Reset affects only this origin in this browser. Exports are downloads, not an import/restore feature.
- Google Fonts is the only third-party content request. Font loading sends normal request metadata to Google; remove the CSS import to use system-font fallbacks without that request. No analytics or tracking SDK is installed.

**Do not enter real employee, applicant, compensation, medical, bank, identity, or confidential workplace information.**

## Preparing for production

Before using real data, replace the browser store with authenticated server endpoints and a protected database. Implement server-side organization/team/record permissions, identity verification, sessions, encryption in transit and at rest, secure backups, protected audit records, retention/deletion controls, input validation, rate limiting, monitoring, and jurisdiction-specific privacy requirements. Review sensitive-field access and exports. Select a qualified payroll provider and define approval responsibilities separately from payment execution. Review accessibility and perform independent security testing. Private hosting access, when used, does not turn this client demo into a secure HR system.

## Source layout

- `src/main.tsx`: React entry point.
- `src/App.tsx`: workspace UI, dashboard, module tables/board, modal forms, settings.
- `src/model.ts`: data model, fictional seed, demo visibility rules, validation, workflow mutations, payroll arithmetic.
- `src/model.test.ts`: meaningful domain tests using Node's built-in test runner.
- `src/styles.css`: responsive layout, typography, components, mobile navigation, reduced-motion support.

Dialogs use native modal focus handling and Escape support. Inputs have labels; actions have accessible names. Tables scroll horizontally on narrow screens while the sidebar becomes a collapsible mobile menu. Respect reduced-motion preferences.

Framework references: [React client APIs](https://react.dev/reference/react-dom/client), [Vite guide](https://vite.dev/guide/).

## Languages
Use the language selector in the top bar for English, O‘zbekcha (Latin), or Русский. Your choice persists in this browser. Interface labels, statuses, validation messages, dates, and amounts are localized. Stored workflow codes and user-entered names, notes, and other record content are preserved; no external translation service is used.
