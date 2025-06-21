import mongooseToSwagger from "mongoose-to-swagger";

import { userModel, productModel, postModel, bannerModel, categoryPostModel, categoryModel, couponModel, couponUsageModel, cartModel } from "../../models/index.js";

import { authSchemas } from "./auth.schemas.js";

const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(productModel),
  User: generateSchema(userModel),
  Banner: generateSchema(bannerModel),
  Post: generateSchema(postModel),
  categoryPostModel: generateSchema(categoryPostModel),
  categoryModel: generateSchema(categoryModel),
  couponModel: generateSchema(couponModel),
  couponUsageModel: generateSchema(couponUsageModel),
  Cart: generateSchema(cartModel),
  ...authSchemas,
};
