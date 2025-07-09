import { body, validationResult } from "express-validator";

export const validateCalculateFee = [
  body("to_district_id").isInt({ min: 1 }),
  body("to_ward_code").notEmpty(),
  body("service_id").isInt({ min: 1 }),
//   body("quantity").isInt({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateCreateOrder = [
  body("order.code").notEmpty(),
  body("order.from_district_id").isInt({ min: 1 }),
  body("order.to_district_id").isInt({ min: 1 }),
  body("order.to_ward_code").notEmpty(),
  body("order.to_name").notEmpty(),
  body("order.to_phone").notEmpty(),
  body("order.to_address").notEmpty(),
  body("order.weight").isInt({ min: 1 }),
  body("order.service_id").isInt({ min: 1 }),
  body("order.items").isArray({ min: 1 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];
