import jwt from "jsonwebtoken";

const generateToken = (payload, secret, options = {}) => {
  return jwt.sign(payload, secret, options);
};
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
export default {
  generateToken,
  verifyToken,
};
