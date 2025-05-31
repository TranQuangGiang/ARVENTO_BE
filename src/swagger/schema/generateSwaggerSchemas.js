import mongooseToSwagger from 'mongoose-to-swagger';
import { productModel, userModel, postModel, bannerModel } from '../../models/index.js';
import { authSchemas } from './auth.schemas.js';

const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(productModel),
  User: generateSchema(userModel),
  Banner: generateSchema(bannerModel),
  Post: generateSchema(postModel),
  ...authSchemas
};
