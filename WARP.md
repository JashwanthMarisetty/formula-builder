# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Formula Builder is a full-stack form creation application that allows users to build dynamic forms with conditional logic and real-time responses. The application consists of a React frontend with Vite and a Node.js/Express backend with MongoDB.

## Development Commands

### Backend Development
```bash
# Start backend server
cd backend
npm install
npm start

# Development with auto-reload
npm run dev

# Backend runs on http://localhost:5000
```

### Frontend Development
```bash
# Start frontend development server
cd frontend
npm install
npm run dev

# Frontend runs on http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Full Application Startup
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Architecture Overview

### Backend Architecture (Node.js/Express)
```
backend/
├── Controllers/          # Business logic handlers
│   ├── userController.js # Authentication & user management
│   └── formController.js # Form CRUD operations
├── models/              # MongoDB schemas
│   ├── User.js         # User data model
│   └── Form.js         # Form structure model
├── routes/             # API route definitions
│   ├── userRoutes.js   # /api/users/* endpoints
│   └── formRoutes.js   # /api/forms/* endpoints
├── middleware/         # Express middleware
│   ├── auth.js        # JWT authentication
│   └── validation.js  # Input validation
├── config/            # Configuration files
│   └── database.js    # MongoDB connection
├── utils/             # Utility functions
│   └── jwt.js         # JWT token management
└── server.js          # Main Express server
```

### Frontend Architecture (React + Vite)
```
frontend/src/
├── contexts/              # React contexts for state management
│   ├── AuthContext.jsx   # Authentication state & methods
│   └── FormContext.jsx   # Form state & operations
├── components/           # Reusable React components
│   └── ProtectedRoute.jsx # Route authentication wrapper
├── services/            # API interaction layer
│   └── api.js          # Axios configuration & API calls
├── pages/              # Main application pages/routes
│   ├── LandingPage.jsx # Public landing page
│   ├── Login.jsx       # User authentication
│   ├── Dashboard.jsx   # Main user dashboard
│   ├── FormBuilder.jsx # Form creation interface
│   └── FormPreview.jsx # Form preview/testing
└── App.jsx             # Main application router
```

## Key Integration Points

### Authentication Flow
- JWT-based authentication with access tokens (7 days) and refresh tokens (30 days)
- Automatic token refresh via axios interceptors
- Google OAuth integration using Firebase
- Protected routes using `ProtectedRoute` component
- Token storage in localStorage with keys: `formula_token`, `formula_refresh_token`, `formula_user`

### Form Management
- Forms are managed through `FormContext` with optimistic updates
- Backend API synchronization with fallback to localStorage
- Multi-page form support with conditional logic
- Field types: text, email, phone, date, time, select, checkbox, radio, textarea, rating, file, address

### API Structure
- Backend API base: `/api`
- User endpoints: `/api/users/*` (register, login, me, refresh-token, google-signin)
- Form endpoints: `/api/forms/*` (CRUD operations, public access, response submission)
- Authentication via `Authorization: Bearer <token>` header

## Development Workflow

### Adding New Features
1. **Backend**: Add route → controller → model updates if needed
2. **Frontend**: Update context → add/modify components → integrate API calls
3. **Test**: Use Postman or other API testing tools to verify endpoints

### Database Operations
- MongoDB connection via Mongoose ODM
- User model handles authentication and profile data
- Form model stores form structure, fields, and metadata
- Automatic timestamps and validation

### Environment Configuration
**Backend (.env required):**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `CORS_ORIGIN` - Frontend URL (http://localhost:5173)

**Frontend (.env optional):**
- `VITE_API_URL` - Backend API URL (defaults to http://localhost:5000/api)

## Testing & Debugging

### API Testing
- Use Postman, cURL, or other API testing tools for comprehensive API testing
- Test authentication flow: register → login → protected operations

### Common Issues
- **CORS errors**: Verify `CORS_ORIGIN` in backend matches frontend URL
- **Authentication failures**: Clear localStorage and re-authenticate
- **Form sync issues**: Check network tab for API call status
- **Database connection**: Verify MongoDB URI and network access

## Key Dependencies

**Backend:**
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT implementation
- `bcrypt` - Password hashing
- `cors` - Cross-origin requests
- `express-validator` - Input validation

**Frontend:**
- `react` + `react-dom` - UI framework
- `react-router-dom` - Client-side routing
- `axios` - HTTP client
- `@hello-pangea/dnd` - Drag and drop for form builder
- `firebase` - Google authentication
- `tailwindcss` - CSS framework
- `vite` - Build tool and dev server

## Form Builder Features

### Core Functionality
- Drag-and-drop form builder interface
- Multi-page forms with navigation
- Conditional field visibility logic
- Real-time form preview
- Response collection and management
- Form sharing and public access

### Advanced Features
- Field conditional logic (show/hide based on other fields)
- Page conditional logic (navigation control)
- Multiple field types with validation
- Form templates and duplication
- Response analytics and export
- Chatbot integration settings
