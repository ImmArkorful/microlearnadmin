# Admin Dashboard

A comprehensive admin dashboard for managing users, lessons, quizzes, and quiz answers in the Microlearnhub application.

## Features

- **Dashboard Overview**: Statistics and recent activity
- **Users Management**: View, edit, delete users with role management
- **Lessons Management**: Full CRUD operations for lessons
- **Quizzes Management**: Create, edit, delete, and toggle quiz status
- **Quiz Answers Management**: View and manage quiz attempts and results

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure API URL:
   - Create a `.env` file in the admin-dashboard folder
   - Add: `VITE_API_BASE_URL=http://localhost:3000` (or your backend URL)

3. Run the development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:5175`

## Admin Access

To access the admin dashboard:

1. A user must have the `admin` role in the database
2. To set a user as admin, update the `users` table:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
3. Login with admin credentials at `/login`

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── context/        # React context (auth)
│   ├── types/          # TypeScript types
│   └── config/         # Configuration files
├── package.json
└── vite.config.ts
```

## API Endpoints

All admin endpoints are prefixed with `/api/admin` and require:
- Valid JWT token in Authorization header
- User must have `admin` role

## Security

- All routes are protected with admin authentication
- Role-based access control enforced on backend
- JWT token validation on every request
