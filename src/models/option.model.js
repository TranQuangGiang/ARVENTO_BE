import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  values: {
    type: [mongoose.Schema.Types.Mixed], // Cho phép string hoặc object
    default: []
  }
}, {
  timestamps: true
});

const Option = mongoose.model('Option', optionSchema);

export default Option;
