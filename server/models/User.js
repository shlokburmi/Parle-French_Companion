import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  picture: { type: String },
  streak: { type: Number, default: 0 },
  lastLogin: { type: Date },
  totalVocabGained: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
