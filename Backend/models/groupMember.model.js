import mongoose from "mongoose";

const GroupMemberSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "joined", "rejected"],
      default: "joined"
    }
  },
  { timestamps: true }
);

// Compound index to ensure unique user-group pairs
GroupMemberSchema.index({ group: 1, user: 1 }, { unique: true });

export default mongoose.model("GroupMember", GroupMemberSchema);