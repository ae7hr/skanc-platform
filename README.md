# SKANC — Creative operations

Workspace for a studio delivering websites, graphic design, and concert visuals. React 19, TypeScript, Vinext, Cloudflare Workers, D1, and Drizzle. Interface: English, Russian, Uzbek (Latin).

## Version history

The original HR starter was pushed first and is preserved in the [hr-baseline-v1 tag](https://github.com/ae7hr/skanc-platform/tree/hr-baseline-v1). The main branch contains expanded SKANC. Public source code and the private deployed workspace have separate access settings. No real records or credentials belong in Git.

## Features

- Clients and contacts; projects linked to clients and team leads; orders with quotes, approvals, production and delivery; concert/event production with dates, venues and responsible staff.
- Employee directory, recruitment, hiring-to-employee conversion, interview scheduling/feedback, learning progress, payroll record approvals, restricted HR cases, performance reviews.
- Shared server database, server-side validation and authorization, membership roles, same-origin write checks, concurrent-save conflict detection, and a database activity history written with successful mutations.
- Search, status filters, linked forms, visible-record JSON export, responsive navigation and saved language preference. Production starts empty, without fictional records.

Create employees and clients first, then projects, orders and events. Linked records must be in the same department. Use statuses to archive/cancel; record deletion is not exposed. Interviews use Asia/Tashkent and 60-minute slots, reject overlapping candidate/interviewer times, and require feedback plus an integer rating from 1–5 when completed. Reviews have the same completion requirement. Learning status follows progress. Hiring creates an employee once.

## Roles and access

| Role               | Access                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Owner              | Configured by the SKANC_OWNER_EMAIL runtime secret; always administrator; cannot be removed in the app.                            |
| Administrator      | All modules, membership management, exports, full activity visibility.                                                             |
| Department manager | Department-scoped studio operations, hiring, interviews, training and reviews; people directory read-only; no payroll or HR cases. |
| Employee           | Own profile, learning, reviews and projects/events where they are lead; read-only.                                                 |

Administrators add members using their ChatGPT sign-in email, choose a role and department, and link employees to their profile. Existing emails update membership. Members can be disabled/re-enabled. This does not send invitations. Private Sites access and app membership are separate checks: the owner must grant the intended person access through Sites sharing settings as well. The application never broadens the Site audience automatically.

Production identity comes from Sites authentication, never a browser role selector. Do not expose this Worker directly behind a gateway that accepts user-supplied identity headers. Deploying outside Sites requires a trusted authentication adapter first.

## External services and limits

Payroll is operational record tracking, not a payroll/payment provider. Amounts are USD; the deduction percentage is an explicit input, not a jurisdiction's tax logic. Draft → Reviewed → Approved requires a saved review; approval locks the record. No money, tax returns, payslips, or benefits enrollment are issued. Course content, email, calendar sync, meeting links, accounting integrations, file uploads, and production media hosting are not connected. No automated employment decisions are made.

Exports may contain sensitive information; store them securely. Downloads are not import/restore tools. The UI shows the latest 100 activity entries; full history stays in D1. Configure database backups/recovery, retention policy and operational monitoring in your hosting account before relying on the system for important business records.

This version stores a versioned workspace document in D1. Saves use compare-and-swap to reject stale edits, rather than overwriting another user's work. Larger workloads and reporting may warrant normalized record tables. Deactivated users lose app access; changing private Site access is a separate owner operation.

## Run locally

Use Node.js 24. Install dependencies from the lockfile:

```sh
npm ci
```

Copy .dev.vars.example to .dev.vars. The local value seedy@sites.test matches the bundled development-only sign-in. It is not a production account. Local secrets and database files are ignored by Git.

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lively_darkstar.sql
npm run dev
```

Apply the migration only once to a new local database. Visit the printed local URL and /signin-with-chatgpt?return_to=/ to enter as the local test identity. Local and production databases are separate. Development identity simulation is excluded from production builds. Keep the dev server on loopback.

```sh
npm test
npx tsc --noEmit
npm run build
```

Tests cover the baseline and SKANC domain: role isolation, linked records, hiring, interview conflicts, completion rules, payroll review/locking and language persistence. The GitHub workflow runs tests, type checks and build.

## Deploy with Sites

The hosting manifest declares D1 binding DB and the existing Site identity. Configure the owner's actual ChatGPT sign-in email as the secret SKANC_OWNER_EMAIL in Sites runtime settings before deployment. No owner email or credential is embedded in source. The supported Sites workflow provisions D1 and applies committed migrations before publication. Keep the private audience. GitHub pushes do not automatically publish to Sites.

For an independent deployment, register your own Site and replace the hosting identity through the supported workflow. Future schema changes use npm run db:generate. Inspect and commit generated SQL and Drizzle metadata. Applied migrations are immutable.

## Source map

- src/Skanc.tsx and src/skanc.css: production UI and forms.
- src/skanc-model.ts: validation, workflows and access rules reused on the server.
- app/api/workspace/route.ts: identity, membership, persistence, concurrent-save checks and activity writes.
- app/chatgpt-auth.ts: Sites sign-in integration.
- db/schema.ts and drizzle/: schema and migrations.
- src/i18n.ts and src/translations.json: translations; entered names and notes remain unchanged.
- src/App.tsx and src/model.ts: preserved starter, not served by the production route. The original runnable version is in the baseline tag.

Vendored framework/Sites support scripts retain their bundled licenses. Never commit .sites-runtime, .wrangler, .dev.vars, database dumps or record exports.
