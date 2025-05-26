import {userModel} from '../models/index.js'
import { jwtUtils } from '../utils/index.js'

const registerUser = async ({ name, email, password, phone, address, role }) => {
  const hashed = await jwtUtils.hashPassword(password);
  const user = await userModel.create({ password: hashed, name, email, phone, address, role });
  return { email: user.email, password: user.password };
};

export default {
  registerUser
}