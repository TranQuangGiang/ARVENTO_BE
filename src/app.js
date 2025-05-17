import express from 'express';
import dotenv from "dotenv";
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from "morgan";
import categoryRouter from './routers/category';

const app = express();
dotenv.config({path: './src/.env'});

// middleware
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));

// kết nối db
mongoose.connect(`mongodb://localhost:27017/${process.env.DB_NAME}`);

// routers

app.use("/api", categoryRouter);

export const viteNodeApp = app;