import mongoose from 'mongoose';

const wordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  word: { type: String, required: true },
  translation: { type: String, default: '' },
  partOfSpeech: { type: String, default: '' },
  definition: { type: String, default: '' },
  examples: [{
    textFr: { type: String, required: true },
    textEn: { type: String, required: true }
  }],
  quiz: {
    question: { type: String, default: '' },
    options: [{ type: String }],
    answer: { type: String, default: '' },
    explanation: { type: String, default: '' }
  }
}, { timestamps: true });

// Ensure a user cannot have duplicate words
wordSchema.index({ userId: 1, word: 1 }, { unique: true });

const Word = mongoose.model('Word', wordSchema);
export default Word;
