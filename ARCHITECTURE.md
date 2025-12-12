# Project Architecture

## Folder Structure

```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   ├── teacher/        # Teacher-specific components
│   ├── student/        # Student-specific components
│   ├── shared/         # Shared components across roles
│   └── ui/             # UI library components (shadcn)
├── pages/
│   ├── Admin/          # Admin pages
│   ├── Teacher/        # Teacher pages
│   ├── Student/        # Student pages
│   └── Auth/           # Authentication pages
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── services/           # API service layers
├── utils/              # Utility functions
├── constants/          # Application constants
├── routes/             # Route configurations
└── lib/                # Third-party library configs
```

## Role Structure

### Admin
- Dashboard with system overview
- User management (CRUD)
- Course management
- System reports and analytics
- System settings

### Teacher
- Dashboard with class overview
- Course management
- Student list
- Grading system
- Attendance tracking
- Schedule management

### Student
- Dashboard with personal overview
- Course enrollment view
- Timetable
- Exams schedule
- Attendance records
- Grade reports
- Messages and notifications

## Key Components

### Authentication
- AuthContext: Manages authentication state
- RoleContext: Manages role-based access
- ProtectedRoute: Route wrapper for authenticated users
- RoleBasedRoute: Route wrapper for role-specific access

### Services
- authService: Authentication operations
- userService: User CRUD operations
- courseService: Course management
- gradeService: Grade management
- attendanceService: Attendance tracking

## Database Schema (To be implemented)

### Tables
- profiles (user profiles)
- user_roles (role assignments)
- courses
- enrollments
- grades
- attendance
- schedules
- messages
- notifications

### Roles Enum
- admin
- teacher
- student
