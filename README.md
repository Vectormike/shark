# Loan Shark App

A comprehensive loan management application built with TypeScript, Node.js, Express, PostgreSQL, Redis, and integrated with Paystack/Flutterwave for payments.

## Features

- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control
- 💰 **Loan Management**: Create, update, delete, and manage loan applications
- 💳 **Payment Integration**: Support for Paystack and Flutterwave payment gateways
- 📊 **User Dashboard**: Profile management and loan tracking
- 🏗️ **Database**: PostgreSQL with Knex.js query builder
- ⚡ **Caching**: Redis for session management and data caching
- 🔒 **Security**: Helmet, CORS, input validation
- 📝 **Logging**: Morgan for HTTP request logging

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js
- **Cache**: Redis
- **Authentication**: JWT with bcryptjs
- **Payment**: Paystack & Flutterwave
- **Security**: Helmet, CORS
- **Development**: Nodemon, ts-node

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)
- pnpm (package manager)

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd loan-shark-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your database credentials, Redis configuration, and API keys.

4. **Database Setup**

   Create a PostgreSQL database:
   ```bash
   createdb loan_shark_db
   ```

   Run the database migration:
   ```bash
   psql -d loan_shark_db -f src/database/migrations/001_initial_schema.sql
   ```

5. **Start Redis** (if not already running)
   ```bash
   redis-server
   ```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm start:dev` - Start development server without hot reload
- `pnpm test` - Run test suite
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `GET /api/users/profile` - Get user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/loans` - Get user's loans (requires auth)

### Loans
- `POST /api/loans` - Create loan application (requires auth)
- `GET /api/loans` - Get user's loans with pagination (requires auth)
- `GET /api/loans/:id` - Get specific loan details (requires auth)
- `PUT /api/loans/:id` - Update loan (requires auth, pending loans only)
- `DELETE /api/loans/:id` - Delete loan (requires auth, pending loans only)
- `POST /api/loans/:id/repayment` - Process loan repayment (requires auth)

### Webhooks
- `POST /api/webhooks/paystack` - Paystack webhook endpoint
- `POST /api/webhooks/flutterwave` - Flutterwave webhook endpoint

### Health Check
- `GET /health` - API health status

## Environment Variables

Key environment variables you need to configure:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/loan_shark_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Payment Gateways
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret_key
```

## Database Schema

The application uses the following main tables:
- **users** - User accounts and profiles
- **loans** - Loan applications and details
- **repayments** - Payment history and transactions
- **notifications** - User notifications

## Payment Integration

The app supports both Paystack and Flutterwave:
- Set `PAYMENT_PROVIDER=paystack` or `PAYMENT_PROVIDER=flutterwave` in your `.env`
- Configure the respective API keys
- Payments are initialized via the repayment endpoints

### Webhook Configuration

The application handles webhooks from both payment providers:

**Paystack Webhooks:**
- Endpoint: `POST /api/webhooks/paystack`
- Events: `transfer.success`, `transfer.failed`, `transfer.reversed`, `charge.success`, `charge.failed`
- Signature verification using HMAC-SHA512

**Flutterwave Webhooks:**
- Endpoint: `POST /api/webhooks/flutterwave`
- Events: `transfer.completed`, `transfer.failed`, `charge.completed`, `charge.failed`
- Signature verification using HMAC-SHA256

Configure your webhook URLs in the respective payment gateway dashboards to point to your application's webhook endpoints.

## Development

1. Start PostgreSQL and Redis services
2. Run `pnpm dev` to start the development server
3. The API will be available at `http://localhost:3000`
4. Visit `http://localhost:3000/health` to check if the server is running

## Project Structure

```
src/
├── config/          # Database and Redis configurations
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic and external services
├── types/           # TypeScript type definitions
├── database/        # Database migrations and seeds
└── server.ts        # Application entry point
```

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
