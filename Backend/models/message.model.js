import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {type: String},
  senderId: {type: String},
  content: {type: String},
  isRead: {type: Boolean, default: false}
}, { timestamps: true });

const messageModel = mongoose.model("Message", messageSchema);
export default messageModel;