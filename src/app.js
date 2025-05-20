import express from 'express';
import routes from './routers/index.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use('/api/v1', routes);
app.use(errorHandler); 

export default app;
