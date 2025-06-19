# Ignite 2026 Backend - Cloudflare Workers

This backend is designed to run on Cloudflare Workers with D1 database.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Login to Cloudflare
```bash
npm run cf:login
```

### 3. Create D1 Database
```bash
npm run cf:d1:create
```

Copy the database ID from the output and update `wrangler.toml`.

### 4. Run Migrations
```bash
# For local development
npm run db:migrate

# For production
npm run db:migrate:prod
```

### 5. Seed Database
```bash
# For local development
npm run db:seed

# For production
npm run db:seed:prod
```

### 6. Start Development Server
```bash
npm run dev
```

## Deployment

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy
```

## Environment Variables

Set these in the Cloudflare Workers dashboard or via `wrangler secret put`:

- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (production/staging)
- `CORS_ORIGIN`: Frontend domain for CORS
- `LOG_LEVEL`: Logging level

## Database Management

### View Database
```bash
npx wrangler d1 info ignite-2026-local
```

### Execute SQL
```bash
npx wrangler d1 execute ignite-2026-local --local --command="SELECT * FROM users LIMIT 5"
```

### Backup Database
```bash
npx wrangler d1 export ignite-2026-prod --output=backup.sql
```

## Default Credentials

- **Admin**: admin@ignite2026.com / admin123
- **Brigade Lead**: lead1@ignite2026.com / lead123  
- **Student**: IG2026001 / student123

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - Admin/Brigade Lead login
- `POST /api/auth/student-login` - Student login
- `GET /api/auth/me` - Get current user
- `GET /api/students` - Get students
- `GET /api/brigades` - Get brigades
- `GET /api/events` - Get events
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/analytics/dashboard` - Dashboard stats

## Architecture

- **Framework**: Hono.js (lightweight web framework for Workers)
- **Database**: Cloudflare D1 (SQLite-based)
- **ORM**: Prisma with D1 adapter
- **Authentication**: JWT tokens
- **File Structure**: Modular routes and middleware