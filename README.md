# Ignite 2026 - Attendance Management System

A comprehensive attendance management system built for Kumaraguru Institutions' Ignite 2026 technical fest, deployed on Cloudflare.

## Features

- **Multi-role Authentication**: Admin, Brigade Lead, and Student roles
- **Real-time Attendance Tracking**: Mark attendance for FN/AN sessions
- **Brigade Management**: Organize students into brigades
- **Event Management**: Create and manage multi-day events
- **Analytics Dashboard**: Comprehensive attendance reports and analytics
- **Bulk Operations**: Upload students via Excel/CSV files
- **Notifications**: System-wide notifications for all users
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend (Cloudflare Workers)
- Hono.js web framework
- Cloudflare D1 (SQLite) database
- Prisma ORM with D1 adapter
- JWT Authentication
- Modular architecture

### Frontend (Cloudflare Pages)
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- Recharts for analytics
- Sonner for notifications

## Deployment Architecture

```
Frontend (Cloudflare Pages) → Backend (Cloudflare Workers) → Database (Cloudflare D1)
```

## Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Login to Cloudflare**
```bash
npm run cf:login
```

4. **Create D1 database**
```bash
npm run cf:d1:create
```

5. **Update wrangler.toml with your database ID**

6. **Run migrations and seed data**
```bash
npm run db:migrate
npm run db:seed
```

7. **Start development server**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Update API URL in .env**
```bash
VITE_API_URL=http://localhost:8787/api
```

5. **Start development server**
```bash
npm run dev
```

## Deployment

### Backend Deployment (Cloudflare Workers)

1. **Deploy to staging**
```bash
cd backend
npm run deploy:staging
```

2. **Deploy to production**
```bash
npm run deploy
```

3. **Set environment variables in Cloudflare dashboard**
- `JWT_SECRET`
- `NODE_ENV`
- `CORS_ORIGIN`

### Frontend Deployment (Cloudflare Pages)

1. **Build the application**
```bash
cd frontend
npm run build
```

2. **Deploy to Cloudflare Pages**
- Connect your GitHub repository to Cloudflare Pages
- Set build command: `npm run build`
- Set build output directory: `dist`
- Set environment variable: `VITE_API_URL=https://your-worker.your-subdomain.workers.dev/api`

## Default Credentials

- **Admin**: admin@ignite2026.com / admin123
- **Brigade Lead**: lead1@ignite2026.com / lead123
- **Student**: IG2026001 / student123

## API Documentation

The API follows RESTful conventions with the following main endpoints:

- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/students` - Student management
- `/api/brigades` - Brigade management
- `/api/events` - Event management
- `/api/attendance` - Attendance tracking
- `/api/analytics` - Analytics and reports
- `/api/notifications` - Notifications

## Database Schema

The system uses Cloudflare D1 (SQLite) with the following main tables:

- `users` - User accounts and authentication
- `students` - Student information and roll numbers
- `brigades` - Brigade organization
- `events` - Event management
- `event_days` - Daily event sessions
- `attendance_records` - Attendance tracking
- `notifications` - System notifications

## Environment Variables

### Backend (Cloudflare Workers)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (production/development)
- `CORS_ORIGIN` - Frontend domain for CORS
- `LOG_LEVEL` - Logging level

### Frontend (Cloudflare Pages)
- `VITE_API_URL` - Backend API URL

## Monitoring and Logs

- **Workers Analytics**: Monitor performance in Cloudflare dashboard
- **D1 Analytics**: Database usage and performance metrics
- **Pages Analytics**: Frontend performance and usage
- **Real-time Logs**: Available in Cloudflare dashboard

## Security Features

- JWT-based authentication
- Role-based access control
- CORS protection
- Input validation
- SQL injection prevention (Prisma ORM)
- Rate limiting (Cloudflare built-in)

## Performance Optimizations

- **Edge Computing**: Workers run at Cloudflare edge locations
- **Global CDN**: Pages served from global CDN
- **Database Optimization**: Efficient queries with Prisma
- **Caching**: Cloudflare automatic caching
- **Compression**: Automatic asset compression

## Backup and Recovery

```bash
# Backup D1 database
npx wrangler d1 export ignite-2026-prod --output=backup.sql

# Restore from backup
npx wrangler d1 execute ignite-2026-prod --file=backup.sql
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the documentation
2. Review Cloudflare Workers/Pages documentation
3. Create an issue in the repository

## License

This project is licensed under the MIT License.