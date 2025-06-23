import mongoose from 'mongoose';

const connectDB = async () => {
  try {
     console.log("✅ Đang kết nối tới:", `${process.env.MONGO_URI}/${process.env.DB_NAME}`);
    await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}`);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('DB connection failed:', error);
    process.exit(1);
  }
}

export default connectDB;
