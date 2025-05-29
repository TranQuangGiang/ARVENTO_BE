import express from 'express';
import cors from 'cors';

import routes from './routers/index.js';
import { swagger, corsConfig, apiLimiter } from './config/index.js';


const app = express();
app.use(cors(corsConfig.corsOptions));
app.use(apiLimiter);
// (async () => {
//   try {
//     await redisClient.connect();
//     console.log('Connected to Redis');
//   } catch (err) {
//     console.error('Redis connection error:', err);
//   }
// })();
app.use(express.json());
app.use('/api-docs', swagger.swaggerUi.serve, swagger.swaggerUi.setup(swagger.swaggerSpec)); 
app.use('/api', routes);

export default app;
