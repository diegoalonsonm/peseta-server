# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview
This repo is a Node.js (ESM) + Express API server for the “Cash Controller” app.

Key traits:
- Express server entrypoint in `index.js` (runs on port `3930`).
- MVC-ish layering:
  - `Routes/` wires HTTP routes to controllers.
  - `Controllers/` handles request/response and delegates to models.
  - `Models/` performs database access (Sequelize `sequelize.query`) and email sending.
- MySQL database (intended to be AWS RDS per `README.md`).

## Common commands (PowerShell)
### Install dependencies
- Install from lockfile:
  - `npm ci`
- If `npm ci` fails (e.g., missing lock consistency), fallback:
  - `npm install`

### Run the server
- Development (auto-reload via nodemon):
  - `npm run dev`
- Production-ish:
  - `npm start`

### Verify DB connectivity
- Smoke-test that the DB credentials in your environment work:
  - `node test-db.js`

### Free the dev port (3930)
If port `3930` is stuck in use:
- Find the PID:
  - `netstat -ano | findstr :3930`
- Kill it:
  - `taskkill /PID <pid> /F`

### Tests / lint
This repo currently does not have a test runner or linter wired up:
- `npm test` is a placeholder that exits with an error (see `package.json`).
- No `lint` script is defined.

If you add tests later, update this section with the exact runner command(s) and how to run a single test.

## Environment variables
The server expects a `.env` (loaded via `dotenv`) providing at least:
- Database (used by `Models/database/db.js` and `test-db.js`):
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
- Email (used by `Models/nodemailer/index.js` for password recovery emails):
  - `EMAIL_USER`
  - `EMAIL_PASS`

Authentication note:
- JWT signing/verifying currently uses a hard-coded secret string (`'secret'`) in `index.js`.

## High-level architecture
### Request flow
1. `index.js` initializes the Express app, sets up middleware (CORS, cookies, body parsing), then mounts routers:
   - `/users` → `Routes/userRouter.js`
   - `/expenses` → `Routes/expenseRouter.js`
   - `/incomes` → `Routes/incomeRouter.js`
2. Each router maps URL patterns to controller methods.
3. Controllers call models and return JSON.
4. Models execute SQL via `db.sequelize.query(...)` and return raw query results.

### Major modules
- Server entrypoint: `index.js`
  - Defines a cookie-based JWT auth middleware (`verifyToken`) used on `GET /`.
  - Implements `POST /login` (sets `token` cookie) and `GET /logout`.
- Routers: `Routes/*.js`
  - Thin routing layer; no validation here.
- Controllers: `Controllers/*.js`
  - Orchestrate params/body extraction and error handling.
- Database connection: `Models/database/db.js`
  - Builds a Sequelize instance using env vars and exports it as `db.sequelize`.
- Data models: `Models/*Model.js`
  - `UserModel`: CRUD-ish operations + password reset (also triggers email).
  - `IncomeModel`: queries the `income` table.
  - `ExpenseModel`: calls stored procedures like `getAllExpensesByEmail(...)`.
- Email: `Models/nodemailer/index.js`
  - Sends password recovery emails using a Hotmail transporter.

### Database shape
`cash-controller-db.sql` contains table definitions and seed inserts for:
- `users`
- `expense`
- `income`
- `category`

Note: `ExpenseModel` references stored procedures (e.g. `getAllExpensesByEmail`, `insertExpense`) that are not defined in `cash-controller-db.sql`; they must exist in the target MySQL instance separately.

## Existing agent/tooling rules in-repo
There is a Claude configuration at `.claude/settings.local.json` that (among other things) whitelists common commands used while developing/debugging this repo (e.g. `npm run dev`, `node`, `curl`, `netstat`, `findstr`, `taskkill`). If you add new standard workflows (tests, migrations, etc.), update this repo guidance accordingly.