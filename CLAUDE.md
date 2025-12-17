# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cash Controller is a personal finance tracking API built with Node.js/Express. The app allows users to track incomes and expenses to maintain monthly budgets. The backend follows MVC architecture and uses MySQL hosted on AWS RDS.

**Tech Stack:**
- Node.js with Express
- MySQL via Sequelize (raw queries)
- JWT authentication with cookies
- Zod for validation
- Nodemailer for email notifications
- AWS SDK (for RDS)

## Development Commands

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# No test suite is currently configured
```

The server runs on port 3930 by default.

## Architecture

### MVC Structure

The codebase follows a standard MVC pattern with three main layers:

**Models/** - Database interaction layer using Sequelize raw queries
- `userModel.js` - User CRUD, authentication, balance calculations
- `expenseModel.js` - Expense tracking and aggregation
- `incomeModel.js` - Income tracking and aggregation
- `database/db.js` - Sequelize connection configuration

**Controllers/** - Business logic and request handling
- `userController.js` - User management, password recovery, balance updates
- `expenseController.js` - Expense creation, retrieval, and aggregation
- `incomeController.js` - Income creation, retrieval, and aggregation

**Routes/** - Express route definitions
- `userRouter.js` - User endpoints
- `expenseRouter.js` - Expense endpoints
- `incomeRouter.js` - Income endpoints

### Authentication Flow

Authentication is handled via JWT tokens stored in HTTP-only cookies:

1. Login endpoint (`POST /login`) is defined in `index.js:49-66` - validates credentials via raw SQL query, issues JWT token
2. `verifyToken` middleware in `index.js:30-43` checks for valid JWT token in cookies
3. Token secret is hardcoded as `'secret'` - should be moved to environment variable
4. Password recovery generates random 8-character password and emails via Nodemailer

### Database Access Pattern

All models use Sequelize raw queries (`db.sequelize.query()`) with named parameter replacements for SQL injection protection:

```javascript
await db.sequelize.query('SELECT * FROM users WHERE email = :email', {
    replacements: { email },
    type: db.sequelize.QueryTypes.SELECT
})
```

Database connection is configured in `Models/database/db.js` using environment variables.

### Balance Calculation

User balance is calculated dynamically by:
1. Querying sum of all incomes for the user
2. Querying sum of all expenses for the user
3. Adding stored `availableBudget` field
4. Formula: `balance + totalIncome - totalExpense`

See `UserModel.getBalance()` in `Models/userModel.js:49-74`.

## Environment Variables

Required environment variables (configured via `.env`):
- `DB_NAME` - MySQL database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host (AWS RDS endpoint)

Additional variables likely needed for:
- Nodemailer configuration (SMTP credentials)
- AWS SDK configuration (if accessing RDS directly)

## CORS Configuration

The API accepts requests from:
- `http://localhost:3000` (local development)
- `https://cash-controller-client.vercel.app` (production frontend)

CORS is configured in `index.js:16-20` with credentials enabled for cookie-based authentication.

## Key Implementation Notes

- All passwords are stored in plain text - this is a security vulnerability
- JWT secret is hardcoded as `'secret'` - should use environment variable
- No input validation with Zod is currently implemented despite being a dependency
- Raw SQL queries are used throughout instead of Sequelize ORM features
- Error handling in models silently catches errors without logging
- Date formatting for expenses/incomes uses `new Date().toISOString().split('T')[0]`
