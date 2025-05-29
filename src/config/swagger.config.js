// src/config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerSchemas } from '../utils/generateSwaggerSchemas.util.js';


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: "Tài liệu API tự động sinh ra bởi swagger-jsdoc",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
      },
    ],
    components: {
      schemas: {
        ...swaggerSchemas,
        ProductInput: {
          type: "object",
          required: ["category_id", "name", "slug", "price", "stock"],
          properties: {
            category_id: { type: "string", example: "1234567890abcdef12345678" },
            name: { type: "string", example: "Áo thun đẹp" },
            slug: { type: "string", example: "ao-thun-dep" },
            description: { type: "string", example: "Áo thun chất liệu cotton" },
            price: {
              type: "string",  
              example: "199.99",
            },
            stock: { type: "integer", example: 150 },
            images: {
              type: "array",
              items: { type: "string", format: "url" },
              example: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
            },
            variants: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  size: { type: "string", maxLength: 10, example: "M" },
                  color: { type: "string", maxLength: 50, example: "red" },
                  stock: { type: "integer", example: 100 },
                },
              },
            },
            tags: {
              type: "array",
              items: { type: "string" },
              example: ["summer", "cotton"],
            },
          },
        },
      },
    },
  },
  apis: ["./src/routers/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

export default { swaggerUi, swaggerSpec };
