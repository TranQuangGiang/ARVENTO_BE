import userModel from '../models/user.model.js'
import { hashPassword } from '../utils/hash.util.js'

export const registerUser = async ({ email, password }) => {
  const hashed = await hashPassword(password);
  const user = await userModel.create({ email, password: hashed });
  return { email: user.email }; // Hide password
};
