// src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API tự động sinh ra bởi swagger-jsdoc',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
      },
    ],
    components: {
      schemas: {
        // Schema cho đăng ký user
        RegisterUser: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              example: 'Nguyen Van A',
              description: 'Tên đầy đủ của người dùng',
            },
            email: {
              type: 'string',
              example: 'user@example.com',
              description: 'Email đăng ký',
            },
            password: {
              type: 'string',
              example: '123456',
              description: 'Mật khẩu đăng ký',
            },
          },
        },

        // Schema login
        LoginUser: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: '123456',
            },
          },
        },

        // Schema Product
        Product: {
          type: 'object',
          required: ['name', 'price'],
          properties: {
            name: {
              type: 'string',
              example: 'Áo thun',
            },
            price: {
              type: 'number',
              example: 150000,
            },
            description: {
              type: 'string',
              example: 'Áo thun cotton mềm mại',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routers/**/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

export default  { swaggerUi, swaggerSpec };
