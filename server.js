import 'dotenv/config'; 
import connectDB from './src/config/db.config.js';
import app from './src/app.js';

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
