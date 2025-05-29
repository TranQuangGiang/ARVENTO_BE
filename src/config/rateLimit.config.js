import rateLimit from 'express-rate-limit';

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // send RateLimit-* headers
  legacyHeaders: false, // disable the X-RateLimit-* headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(options.message);
  },
  // Optional: example to whitelist internal IPs
  // skip: (req) => {
  //   const whitelist = ['::1', '127.0.0.1'];
  //   return whitelist.includes(req.ip);
  // },
});

export default rateLimiter;
