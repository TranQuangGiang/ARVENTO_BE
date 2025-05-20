import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('DB connection failed:', error);
    process.exit(1);
  }
}

export default connectDB;
