import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerUiOptions } from 'swagger-ui-express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PayLentine Backend API',
    version: '1.0.0',
    description: 'API documentation for PayLentine Backend application',
    termsOfService: 'http://example.com/terms/',
    contact: {
      name: 'API Support',
      url: 'http://www.paylentine.com/support',
      email: 'support@paylentine.com',
    },
    license: {
      name: 'Licensed Under MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Development server',
    },
    {
      url: 'https://api.paylentine.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        required: ['email', 'firstName', 'lastName'],
        properties: {
          id: {
            type: 'integer',
            description: 'User ID',
            example: 1,
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            description: 'User role',
            example: 'user',
          },
          isActive: {
            type: 'boolean',
            description: 'User active status',
            example: true,
          },
          profilePicture: {
            type: 'string',
            description: 'Profile picture URL',
            example: 'http://example.com/avatar.jpg',
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last login timestamp',
            example: '2023-01-01T00:00:00.000Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
            example: '2023-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
            example: '2023-01-01T00:00:00.000Z',
          },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Request success status',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Response message',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
          error: {
            type: 'string',
            description: 'Error message (if any)',
            example: 'Something went wrong',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Response timestamp',
            example: '2023-01-01T00:00:00.000Z',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'password123',
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'password123',
          },
          firstName: {
            type: 'string',
            description: 'User first name',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'User last name',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['admin', 'user'],
            description: 'User role',
            example: 'user',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controller/*.ts',
    './src/models/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerUiOptions: SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'PayLentine API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}; 