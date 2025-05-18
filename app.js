const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const userRouter = require('./routes/userRouter');


const app = express();
app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'http://example.com'] // Thêm các domain được phép
}));

mongoose.connect('mongodb://localhost:27017/be_nodejs').then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

app.use(express.json());

// routes
app.use('/users', userRouter);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });