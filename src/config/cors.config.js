const corsOptions = {
  origin: 'http://localhost:3000', 
  methods: [ 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
export default corsOptions
