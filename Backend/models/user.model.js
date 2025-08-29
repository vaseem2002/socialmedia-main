import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, max: 25 },
  username: { type: String, required: true, max: 20, unique: true },
  password: { type: String, required: true },

  // Cloudinary fields for profile and cover picture
  profilePicture: { type: String, default: "" }, // URL for profile picture
  profilePicturePublicId: { type: String, default: "" }, // Cloudinary public ID for profile picture
  
  coverPicture: { type: String, default: "" }, // URL for cover picture
  coverPicturePublicId: { type: String, default: "" }, // Cloudinary public ID for cover picture
  
  followers: { type: Array, default: [] },
  following: { type: Array, default: [] },
  requestedTo: { type: Array, default: [] },
  requestedBy: { type: Array, default: [] },
  blockedUsers: { type: Array, default: [] },
  isPrivate: { type: Boolean, default: false },
}, { timestamps: true });

const userModel = mongoose.model("User", userSchema);
export default userModel;