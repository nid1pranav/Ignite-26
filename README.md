# Ignite 2026 - Attendance Management System

A comprehensive attendance management system built for Kumaraguru Institutions' Ignite 2026 technical fest.

## Features

- **Multi-role Authentication**: Admin, Brigade Lead, and Student roles
- **Real-time Attendance Tracking**: Mark attendance for FN/AN sessions
- **Brigade Management**: Organize students into brigades
- **Event Management**: Create and manage multi-day events
- **Analytics Dashboard**: Comprehensive attendance reports and analytics
- **Bulk Operations**: Upload students via Excel/CSV files
- **Notifications**: Real-time notifications for all users
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL with Prisma ORM
- JWT Authentication
- Socket.io for real-time features
- Winston for logging
- Multer for file uploads

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- Recharts for analytics
- Sonner for notifications

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ignite-2026
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
```bash
# Backend
cp backend/.env.ex backend/.env
# Update database credentials and other settings
```

5. Set up the database
```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

6. Start the development servers
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

## Default Credentials

- **Admin**: admin@ignite2026.com / admin123
- **Brigade Lead**: lead1@ignite2026.com / lead123
- **Student**: IG2026001 / student123

## Deployment

### Backend Deployment
1. Set production environment variables
2. Run database migrations
3. Build and start the server

### Frontend Deployment
1. Update API URL in environment
2. Build the application
3. Deploy to static hosting

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
- `/api/uploads` - File uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.