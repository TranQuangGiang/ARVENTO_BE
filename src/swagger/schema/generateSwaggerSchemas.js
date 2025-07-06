import mongooseToSwagger from "mongoose-to-swagger";

import { userModel, Product, postModel, bannerModel, categoryPostModel, categoryModel, couponModel, couponUsageModel, cartModel, Variant, favoriteModel, Review, addressModel, Option } from "../../models/index.js";

import { authSchemas } from "./auth.schemas.js";

const generateSchema = (model) => mongooseToSwagger(model);

export const swaggerSchemas = {
  Product: generateSchema(Product),
  User: generateSchema(userModel),
  Banner: generateSchema(bannerModel),
  Post: generateSchema(postModel),
  categoryPostModel: generateSchema(categoryPostModel),
  categoryModel: generateSchema(categoryModel),
  couponModel: generateSchema(couponModel),
  couponUsageModel: generateSchema(couponUsageModel),

  Variant: generateSchema(Variant),

  Cart: generateSchema(cartModel),
  favoriteModel: generateSchema(favoriteModel),
  Review: generateSchema(Review),
  Address: generateSchema(addressModel),
    Option: generateSchema(Option),
  ...authSchemas,
};
