import { verifyToken } from '../utils/jwt.util.js';

export const authenticateToken = (req, res, next) =>  {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: 'Invalid token' });
  }
}

