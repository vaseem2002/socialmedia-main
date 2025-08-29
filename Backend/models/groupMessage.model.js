import mongoose from "mongoose";

const GroupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      trim: true
    },
    media: {
      type: String
    },
    mediaType: {
      type: String,
      enum: ["image", "video", null],
      default: null
    },
    isEditable: {
      type: Boolean,
      default: true
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

// Middleware to disable editing after 1 hour
GroupMessageSchema.pre('save', function(next) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (this.createdAt < oneHourAgo) {
    this.isEditable = false;
  }
  next();
});

// Index for faster group message retrieval
GroupMessageSchema.index({ group: 1, createdAt: -1 });

export default mongoose.model("GroupMessage", GroupMessageSchema);