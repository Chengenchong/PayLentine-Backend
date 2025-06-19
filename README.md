# PayLentine Backend

A TypeScript Node.js backend application built with Express.js.

## Project Structure

```
src/
├── config/           # Configuration files and environment settings
├── constants/        # Application constants and enums
├── controller/       # Request handlers and business logic controllers
├── database/         # Database connection and configuration
├── middleware/       # Express middleware functions
├── models/          # Data models and database entities
├── routes/          # API route definitions
├── schemas/         # Validation schemas (Joi, Zod, etc.)
├── services/        # Business logic and external service integrations
├── tests/           # Test files
├── types/           # TypeScript type definitions
│   └── express/     # Express-specific type extensions
├── utils/           # Utility functions and helpers
├── app.ts           # Express application setup
└── server.ts        # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

### Development

1. Create your `.env` file from the example:
   ```bash
   copy env.example .env
   ```

2. Configure your database settings in `.env`

3. Set up the database and create admin user:
   ```bash
   npm run seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000` by default.

### API Documentation

Visit `http://localhost:3000/api-docs` to view the interactive Swagger API documentation.

### Building for Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:watch` - Start development server with file watching
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run clean` - Clean build directory
- `npm run type-check` - Run TypeScript type checking
- `npm run seed` - Run database seeders
- `npm run db:setup` - Set up database with initial data
- `npm test` - Run tests

## API Endpoints

### System
- `GET /health` - Check server status
- `GET /api-docs` - Swagger API documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | Database connection string | - |
| `JWT_SECRET` | JWT signing secret | - |

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License. 