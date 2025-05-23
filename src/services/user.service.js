import userModel from '../models/user.model.js'
import { hashPassword } from '../utils/hash.util.js'

export const registerUser = async ({ name, email, password, phone, address, role }) => {
  const hashed = await hashPassword(password);
  const user = await userModel.create({ password: hashed, name, email, phone, address, role });
  return { email: user.email, password: user.password };
};
