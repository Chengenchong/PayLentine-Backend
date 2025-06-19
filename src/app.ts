import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { testConnection } from './database';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import apiRoutes from './routes';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'PayLentine Backend is running!',
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  });
});

// API Routes
app.use('/api', apiRoutes);

// Database connection test on startup
const initializeDatabase = async () => {
  try {
    await testConnection();
    console.log('🗄️  Database connection established successfully');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    // Don't exit the process, let the application run without database
    // process.exit(1);
  }
};

// Initialize database connection
initializeDatabase();

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      health: '/health',
      api: '/api',
      docs: '/api-docs'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

export default app; 