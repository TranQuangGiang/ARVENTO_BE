import {userService} from "../services/index.js"

export const register  = async (req, res, next) => {
  try {
    const result = await userService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
