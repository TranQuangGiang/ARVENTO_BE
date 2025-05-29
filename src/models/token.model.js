import mongoose from 'mongoose'

const tokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['refresh', 'verify_email', 'reset_password'], 
    required: true 
  },
  expiresAt: { type: Date, required: true }, 
  createdAt: { type: Date, default: Date.now },
});

export default  mongoose.model('Token', tokenSchema);
