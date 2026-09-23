<<<<<<< HEAD
# Job-Learner
=======
# JOB-LEARNER
JOB-LEARNER is a Smart India Hackathon student platform that lays the foundation for AI-powered career and learning guidance. Stage 1 delivers a polished landing page, student accounts, secure authentication, PostgreSQL persistence, profile editing, and a protected student dashboard.

Stage 2 adds college-to-branch management, official curricula (semesters and subjects), a student curriculum view, and role-protected administration.

## Technology stack

- Next.js (App Router), React, TypeScript, Tailwind CSS
- PostgreSQL with parameterized `pg` queries
- bcrypt password hashing and signed, HttpOnly JWT session cookies (`jose`)

## Prerequisites

- Node.js 20.9+ and npm
- PostgreSQL 14+ with `psql` available on your PATH

## Setup

1. Install project dependencies:

   ```bash
   npm install
   ```

2. Create a PostgreSQL database and user (adjust names/passwords as desired):

   ```sql
   CREATE USER joblearner WITH PASSWORD 'choose-a-strong-password';
   CREATE DATABASE job_learner OWNER joblearner;
   ```

3. Copy `.env.example` to `.env.local` and set a valid connection string plus a long random `AUTH_SECRET`.

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32
   ```

4. Create and seed the schema.xyz:

   ```bash
   npm run db:schema
   npm run db:seed
   ```

5. Start development:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Registering creates a PostgreSQL user/profile record; login sets a secure HttpOnly session; `/dashboard` is protected; profile edits are persisted; Logout clears the session.

## Checks

```bash
npm run lint
npm run build
```

## Database foundation

- `users`: account identity and bcrypt password hashes
- `colleges`: scalable institute catalogue
- `branches`: shared branch catalogue
- `student_profiles`: one-to-one student data, linked to users, colleges, and branches
- `college_branches`: branch availability at each institute
- `curricula`, `semesters`, `subjects`: official, versioned academic curriculum data

The initial catalog in `database/seed.sql` is deliberately small and can be extended with thousands of colleges later. AI, external-resource, job-market, and recommendation features are intentionally deferred.

## Stage 2 administration

Register a normal account, then promote it directly in PostgreSQL (there is intentionally no public admin-registration route):

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

Sign out and back in, then visit `/admin`. Admins can manage colleges, associate branches with colleges, and add curriculum subjects. The student curriculum at `/curriculum` is always selected from the student's own college and branch.
>>>>>>> 01dbb15 (initial commit)
