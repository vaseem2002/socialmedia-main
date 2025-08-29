import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  caption: { type: String, max: 500, required: true },
  mediaType: { type: String, required: true }, // image or video
  mediaUrl: { type: String, required: true }, // Cloudinary URL
  publicId: { type: String, required: true }, // Needed for deletion
  likes: { type: Array, default: [] },
  saves: { type: Array, default: [] },
  commentCount: { type: Number, default: 0 }
}, { timestamps: true });

const postModel = mongoose.model("Post", postSchema);
export default postModel;