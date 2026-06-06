import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  sentence: { type: String, required: true },
  sentenceEn: { type: String, default: '' },
  userText: { type: String, default: '' },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  tip: { type: String, default: '' },
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  words: [String],
  rounds: [{
    sentence: String,
    sentenceEn: String,
    userText: String,
    score: Number,
    feedback: String,
    tip: String
  }],
  averageScore: Number,
  vocabGained: { type: Number, default: 0 }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

export default Session;
