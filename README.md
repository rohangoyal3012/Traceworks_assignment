# Authentication System

A minimalistic authentication system with signup/signin functionality using NestJS backend, Next.js frontend, PostgreSQL database, and Redis for session caching.

## Features

- **Backend (NestJS)**

  - Custom JWT implementation (no external JWT packages)
  - Password hashing with PBKDF2
  - PostgreSQL database integration
  - Redis caching for fast token validation
  - Proper abstraction and reusable architecture

- **Frontend (Next.js)**

  - Modern, responsive UI
  - Client-side authentication state management
  - Protected routes
  - Sign up, sign in, and sign out functionality

- **Infrastructure**
  - Docker and Docker Compose setup
  - PostgreSQL database
  - Redis cache
  - Environment-based configuration

## Project Structure

```
.
├── backend/                # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # User management module
│   │   ├── database/      # Database service
│   │   ├── redis/         # Redis service
│   │   └── utils/         # Crypto utilities (JWT, password hashing)
│   ├── Dockerfile
│   └── package.json
├── frontend/              # Next.js frontend
│   ├── app/              # App router pages
│   ├── contexts/         # Auth context
│   ├── lib/              # API client and auth service
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml    # Docker orchestration
└── .env.example         # Environment variables template

```

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- **No manual npm install required** - Docker handles all dependencies automatically

### Running with Docker

1. Clone the repository
2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start all services:

   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Local Development (Optional)

**Note**: Docker handles all dependencies. For local development without Docker:

#### Backend

```bash
cd backend
npm install  # Only needed for IDE support, Docker handles this automatically
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install  # Only needed for IDE support, Docker handles this automatically
npm run dev
```

**Important**: The application runs entirely in Docker - no local npm install is required for deployment.

## API Endpoints

- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - Sign in existing user
- `POST /auth/signout` - Sign out (requires authentication)
- `POST /auth/validate` - Validate token (requires authentication)

## Architecture Highlights

### Custom JWT Implementation

**No external npm packages for crypto/auth functionality**. Custom implementation using Node.js built-in `crypto` module for:

- Token generation with HS256 algorithm
- Token verification
- Expiration handling

**Note**: NestJS framework packages are required (handled by Docker), but no external crypto/auth libraries like `jsonwebtoken`, `bcrypt`, etc.

### Password Security

- PBKDF2 with 10,000 iterations (using Node.js built-in `crypto.pbkdf2Sync`)
- Random salt generation (using `crypto.randomBytes`)
- SHA-512 hashing
- **No external password hashing libraries**

### Redis Caching Strategy

- Tokens cached on login for fast validation
- Reduces database queries
- Improves performance for concurrent users
- Automatic expiration matching JWT expiry

### Database Design

- Simple users table with indexes
- Auto-initialization on startup
- Connection pooling for performance

## Environment Variables

See `.env.example` for all available configuration options.

**Important:** Change `JWT_SECRET` in production!

## Security Notes

- Always use HTTPS in production
- Change default passwords and secrets
- Implement rate limiting for production
- Add input validation middleware
- Consider adding refresh tokens for production use

## License

MIT
