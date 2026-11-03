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

Administrators add members using their verified Firebase sign-in email, choose a role and department, and link employees to their profile. Existing emails update membership. Members can be disabled/re-enabled. Registration alone grants no workspace access. This does not send invitations.

Google and email/password sign-in use Firebase Authentication. Email verification is required. Passwords are managed by Firebase and never stored in the workspace database. Every workspace API request requires a Firebase ID token; the server verifies its RS256 signature, project audience, issuer, expiry, authentication time and verified email using Google's public keys. ChatGPT identity headers do not grant workspace access. Workspace roles are checked against the database on every request. This verifier does not check Firebase token revocation: an already-issued token may remain valid until expiry (normally about one hour). Disable workspace membership to revoke business-data access immediately; the owner is managed through the runtime configuration.

The public login page can be accessible to everyone while workspace APIs remain restricted. A private Sites gateway, if enabled, adds a separate access check. Remove that gateway only after Firebase configuration and server authentication are deployed and verified.

## External services and limits

Payroll is operational record tracking, not a payroll/payment provider. Amounts are USD; the deduction percentage is an explicit input, not a jurisdiction's tax logic. Draft → Reviewed → Approved requires a saved review; approval locks the record. No money, tax returns, payslips, or benefits enrollment are issued. Firebase supplies verification and password-reset email when configured; business notifications, course content, calendar sync, meeting links, accounting integrations, file uploads, and production media hosting are not connected. No automated employment decisions are made.

Exports may contain sensitive information; store them securely. Downloads are not import/restore tools. The UI shows the latest 100 activity entries; full history stays in D1. Configure database backups/recovery, retention policy and operational monitoring in your hosting account before relying on the system for important business records.

This version stores a versioned workspace document in D1. Saves use compare-and-swap to reject stale edits, rather than overwriting another user's work. Larger workloads and reporting may warrant normalized record tables. Deactivated members lose API access on their next request; changing private Site access is a separate owner operation.

## Run locally

Use Node.js 24. Install dependencies from the lockfile:

```sh
npm ci
```

Copy .dev.vars.example to .dev.vars. Set SKANC_OWNER_EMAIL to your verified account email and SKANC_FIREBASE_CONFIG to the public Firebase web config. Use a separate Firebase project for development. Local environment and database files are ignored by Git. There is no authentication bypass for local workspace APIs.

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_lively_darkstar.sql
npm run dev
```

Apply the migration only once to a new local database. Visit the printed local URL and sign in through Google or email/password. Local and production databases are separate. Keep the dev server on loopback.

```sh
npm test
npx tsc --noEmit
npm run build
```

Tests cover the baseline and SKANC domain: role isolation, linked records, hiring, interview conflicts, completion rules, payroll review/locking, language persistence and Firebase token security. The GitHub workflow runs tests, type checks and build. Token tests generate isolated signing keys and need no Google credentials.

## Configure Firebase

Register a Web app in your Firebase project and copy its public apiKey, authDomain, projectId and appId into SKANC_FIREBASE_CONFIG as a JSON string. This is public client configuration, not a service-account credential. No service-account private key is needed.

In Authentication, enable Google and Email/Password. Select the intended Google support email. Configure a password policy requiring at least 12 characters; the registration UI also requires 12. Enable email enumeration protection. Add every actual app hostname to Authorized domains, including skanc.devvault.studio, the Sites hostname and localhost for local testing. Verification/reset links return to the current app origin. Use Firebase's email templates to configure the sender and language as needed. The SDK uses session-scoped browser persistence and provides sign-out.

Test Google login, email signup, email verification and password reset with accounts you control before admitting employees. Users without membership should receive Access denied even after successful login. Do not create test employee records in production.

## Deploy with Sites

The hosting manifest declares D1 binding DB and the existing Site identity. Configure the owner's verified Firebase email as SKANC_OWNER_EMAIL and the public config JSON as SKANC_FIREBASE_CONFIG in Sites runtime settings before deployment. No owner email or privileged credential is embedded in source. The supported Sites workflow provisions D1 and applies committed migrations before publication. GitHub pushes do not automatically publish to Sites. Deploy and verify Firebase authentication before making the login page public or routing a custom domain. Without configuration the login displays a setup error and workspace APIs remain closed.

For an independent deployment, register your own Site and replace the hosting identity through the supported workflow. Future schema changes use npm run db:generate. Inspect and commit generated SQL and Drizzle metadata. Applied migrations are immutable.

## Source map

- src/Skanc.tsx and src/skanc.css: production UI and forms.
- src/skanc-model.ts: validation, workflows and access rules reused on the server.
- app/api/workspace/route.ts: identity, membership, persistence, concurrent-save checks and activity writes.
- src/AuthGate.tsx and src/auth.css: Google/email login, registration, verification and recovery UI.
- app/firebase-auth.ts and src/firebase-token.ts: server configuration and token verification.
- app/api/auth-config/route.ts: public Firebase web configuration (no private keys).
- db/schema.ts and drizzle/: schema and migrations.
- src/i18n.ts and src/translations.json: translations; entered names and notes remain unchanged.
- src/App.tsx and src/model.ts: preserved starter, not served by the production route. The original runnable version is in the baseline tag.

Vendored framework/Sites support scripts retain their bundled licenses. Never commit .sites-runtime, .wrangler, .dev.vars, database dumps or record exports.
