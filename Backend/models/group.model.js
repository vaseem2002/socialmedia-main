import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    privacy: {
      type: String,
      enum: ["public", "private", "invite-only"],
      default: "public"
    },
    avatar: {
      type: String,
      default: ""
    },
    coverPhoto: {
      type: String,
      default: ""
    },
    membersCount: {
      type: Number,
      default: 0
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Group", GroupSchema);