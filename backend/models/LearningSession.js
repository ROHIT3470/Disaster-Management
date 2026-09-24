import mongoose from "mongoose";

// ============================================================
// MESSAGE SUB-SCHEMA
// ============================================================

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      maxlength: 16000,
    },

    visuals: {
      type: [
        {
          url: { type: String, trim: true, maxlength: 2000 },
          alt: { type: String, trim: true, maxlength: 300 },
          caption: { type: String, trim: true, maxlength: 500 },
          source: { type: String, trim: true, maxlength: 200 },
          type: { type: String, trim: true, maxlength: 40 },
          live: { type: Boolean, default: false },
        },
      ],
      default: [],
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// ============================================================
// LEARNING SESSION SCHEMA
// ============================================================

const learningSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messages: {
      type: [messageSchema],
      default: [],
    },

    topic: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    learningLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    sessionType: {
      type: String,
      enum: ["chat", "study", "emergency"],
      default: "chat",
    },
  },
  {
    timestamps: true,
  },
);

// Keep only last 80 messages per session to prevent unbounded growth
learningSessionSchema.pre("save", function () {
  if (this.messages.length > 80) {
    this.messages = this.messages.slice(-80);
  }
});

export default mongoose.model("LearningSession", learningSessionSchema);
