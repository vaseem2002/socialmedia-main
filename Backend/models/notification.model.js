import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String, required: true },
  senderId: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
