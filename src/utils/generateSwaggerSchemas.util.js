import mongooseToSwagger from 'mongoose-to-swagger';
import Product from '../models/product.model.js';

const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(Product),
};
