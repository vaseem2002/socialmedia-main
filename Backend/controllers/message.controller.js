import Message from "../models/message.model.js";
import Chat from "../models/chat.model.js";

// fetches messages for a specific chat
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages: ", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// sends a new message
const sendMessage = async (req, res) => {
  const newMessage = new Message(req.body);
  try {
    const savedMessage = await newMessage.save();
    // validate chat existence
    const chat = await Chat.findById(savedMessage.chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    
    let unreadCount = chat.unreadMessagesCount;
    if (!savedMessage.isRead) unreadCount++;
    // update chat's last message and unread count
    await chat.updateOne({
      lastMessage: {
        senderId: savedMessage.senderId,
        content: savedMessage.content,
        createdAt: savedMessage.createdAt,
      },
      unreadMessagesCount: unreadCount,
    });

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending message: ", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// marks messages as read
const markAsRead = async (req, res) => {
  const { messageIds, chatId } = req.body;
  try {
    // update the isRead status for the given message IDs
    await Message.updateMany({ _id: { $in: messageIds } }, { $set: { isRead: true } });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });
  
    // reset unread message count to 0 (assuming all messages are marked as read)
    await chat.updateOne({ unreadMessagesCount: 0 });

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read: ", error);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

export { getMessages, sendMessage, markAsRead };
