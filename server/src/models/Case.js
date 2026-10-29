import mongoose from 'mongoose';

const suspectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    relationship: { type: String, required: true },
    alibi: { type: String, required: true }
  },
  { _id: false }
);

const clueSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    pointsTo: { type: String, default: null },
    type: {
      type: String,
      required: true,
      enum: ['incriminating', 'exonerating', 'red_herring', 'neutral']
    },
    discovered: { type: Boolean, default: false },
    discoveredAt: { type: Date, default: null }
  },
  { _id: false }
);

const hintSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    text: { type: String, required: true },
    revealed: { type: Boolean, default: false }
  },
  { _id: false }
);

const solutionSchema = new mongoose.Schema(
  {
    culpritId: { type: String, required: true },
    motive: { type: String, required: true },
    method: { type: String, required: true },
    explanation: { type: String, required: true }
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    cluesDiscovered: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 }
  },
  { _id: false }
);

const accusationSchema = new mongoose.Schema(
  {
    suspectId: { type: String, required: true },
    correct: { type: Boolean, required: true },
    accusedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    base: { type: Number, required: true },
    cluePoints: { type: Number, required: true },
    hintPenalty: { type: Number, required: true },
    total: { type: Number, required: true }
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    premise: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard']
    },
    story: { type: String, required: true },
    suspects: [suspectSchema],
    clues: [clueSchema],
    hints: [hintSchema],
    solution: { type: solutionSchema, required: true },
    progress: {
      type: progressSchema,
      default: () => ({ cluesDiscovered: 0, hintsUsed: 0 })
    },
    accusation: { type: accusationSchema, default: null },
    score: { type: scoreSchema, default: null },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically delete cases older than 30 days
caseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Case = mongoose.model('Case', caseSchema);
export default Case;
