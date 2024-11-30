# Fundbox

A Next.js application with Drizzle ORM and PostgreSQL.

## Requirements

- Bun (https://bun.sh)
- PostgreSQL 14+ (https://brew.sh/): `brew install postgresql@14`

## Project Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgres://postgres:yourpassword@localhost:5432/fundbox"
```

### 3. Setup Database

Connect to PostgreSQL and create database:

```bash
psql -U postgres
CREATE DATABASE fundbox;
CREATE USER fundbox_user WITH PASSWORD 'test123';
GRANT ALL PRIVILEGES ON DATABASE fundbox TO fundbox_user;
ALTER DATABASE fundbox OWNER TO fundbox_user;
\q # to exit
```

### 4. Run migrations

```bash
bun db:generate
bun db:push
```

### 5. Verify migrations

```bash
psql -d fundbox -U fundbox_user -W
\dt
```

### 6. Start development

```bash
bun dev
```

## Available Commands

```bash
bun run dev          # Start development server
bun run db:generate  # Generate migrations
bun run db:push      # Push migrations to database
```

## Database Seeding

The application includes scripts to seed your database with test data. You can manage seeding through these commands:

### Seed Commands

```bash
bun seed             # Seed only test data (fundraisers, supporters, orders, draws)
bun seed --with-auth # Seed everything including organizations and admin accounts
bun cleanup         # Remove all test data while preserving organizations and admins
```

### Seeding Details

- **Standard Seed** (`bun seed`):

  - Creates 15 fundraisers
  - Seeds 5,000 supporters
  - Generates 5,000 orders
  - Creates 30 draw events
  - Requires existing organizations and admins

- **Full Seed** (`bun seed --with-auth`):

  - Seeds default organizations and admin accounts
  - Then performs standard seed
  - Use this when setting up a fresh database

- **Cleanup** (`bun cleanup`):
  - Removes all test data
  - Preserves organization and admin data
  - Resets auto-increment sequences

### Notes

- Organizations and admins are preserved during cleanup to maintain auth consistency
- Standard seed requires existing organizations and admins
- All passwords for seeded admin accounts are set to "password123"
