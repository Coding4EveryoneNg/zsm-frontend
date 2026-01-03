# Zentrium School Management - React Client

A modern React.js frontend application for the Zentrium School Management System with an orange and black theme.

## Features

- 🎨 **Orange & Black Theme** - Modern, professional design
- 🔐 **Authentication** - Login, Register, Password Reset
- 📊 **Role-based Dashboards** - Student, Teacher, Admin, Principal, SuperAdmin, Parent
- 👥 **User Management** - Students, Teachers, Admins, SuperAdmins
- 📚 **Academic Management** - Assignments, Examinations, Courses, Books
- 💰 **Financial Management** - Payments and Transactions
- 📈 **Reports** - Comprehensive reporting system
- 🔔 **Notifications** - Real-time notifications
- ⚙️ **Settings** - School, Session/Term, Tenant management

## Tech Stack

- **React 18** - UI library
- **React Router 6** - Routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **Vite** - Build tool

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- API server running on `https://localhost:7037`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=https://localhost:7037/api
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Common/         # Common components (Loading, etc.)
│   └── Layout/         # Layout components (Header, Sidebar)
├── contexts/           # React contexts (AuthContext)
├── pages/              # Page components
│   ├── Auth/          # Authentication pages
│   ├── Dashboard/     # Dashboard pages
│   ├── Management/    # Management pages
│   ├── Academic/      # Academic pages
│   ├── Financial/     # Financial pages
│   └── Reports/       # Reports pages
├── services/           # API services
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## API Integration

The application consumes the Zentrium School Management API. All API calls are made through the `api` service which includes:

- Automatic token injection
- Error handling
- Response interceptors

## Authentication

The app uses JWT tokens stored in localStorage. The `AuthContext` manages authentication state and provides:

- `login(email, password, rememberMe)` - Login user
- `logout()` - Logout user
- `user` - Current user object
- `isAuthenticated` - Authentication status

## Routing

Routes are protected based on user roles. The `ProtectedRoute` component ensures only authorized users can access certain pages.

## Theme

The application uses CSS custom properties for theming:

- Primary Orange: `#ff6b35`
- Primary Black: `#1a1a1a`
- Secondary Black: `#2d2d2d`

All theme colors are defined in `src/index.css`.

## Development

### Adding a New Page

1. Create the page component in the appropriate folder under `src/pages/`
2. Add the route in `src/App.jsx`
3. Add menu item in `src/components/Layout/Sidebar.jsx` if needed

### Adding a New API Service

1. Create a service file in `src/services/`
2. Use the `api` instance from `src/services/api.js`
3. Export service functions

## License

Copyright © Zentrium School Management System

