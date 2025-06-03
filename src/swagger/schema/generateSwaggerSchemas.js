import mongooseToSwagger from 'mongoose-to-swagger';

import {userModel, productModel, postModel, bannerModel, categoryPostModel } from '../../models/index.js';

import { authSchemas } from './auth.schemas.js';

const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(productModel),
  User: generateSchema(userModel),
  Banner: generateSchema(bannerModel),
  Post: generateSchema(postModel),
  categoryPostModel: generateSchema(categoryPostModel),
  ...authSchemas
};
