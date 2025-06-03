import mongooseToSwagger from 'mongoose-to-swagger';
import {productModel, postModel, bannerModel, categoryPostModel } from '../../models/index.js';
import { authSchemas } from './auth.schemas.js';


const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(productModel),
  Banner: generateSchema(bannerModel),
  Post: generateSchema(postModel),
  categoryPostModel: generateSchema(categoryPostModel),
  ...authSchemas
};
