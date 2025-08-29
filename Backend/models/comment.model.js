import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  postId: { type: String, required: true },
  text: { type: String },
}, { timestamps: true });

const commentModel = mongoose.model("Comment", commentSchema);
export default commentModel;