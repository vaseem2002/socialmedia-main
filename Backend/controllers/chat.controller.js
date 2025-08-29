import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

// creates a new chat between two users
const createChat = async (req, res) => {
  const { senderId, recieverId } = req.body;
  try {
    // check for existing chat
    const existingChat = await Chat.findOne({ members: { $all: [senderId, recieverId] } });
    if (existingChat) return res.status(200).json(existingChat);

    // create a new chat
    const newChat = new Chat({ members: [senderId, recieverId] });
    const savedChat = await newChat.save();

    res.status(201).json(savedChat);
  } catch (error) {
    console.error("Error creating chat: ", error);
    res.status(500).json({ message: "Failed to create chat" });
  }
};

// retrieves chats for a specific user
const getChats = async (req, res) => {
  const { userId } = req.params;
  try {
    // find chats involving the user
    const chats = await Chat.find({ 
      members: { $in: [userId] },
      lastMessage: { $ne: null }
    }).sort({ updatedAt: -1 });

    // fetch sender details for each chat
    const filteredChats = await Promise.all(
      chats.map(async (chat) => {
        const senderId = chat.members.find((id) => id !== userId);
        const sender = await User.findById(senderId).select("_id username profilePicture"); 
        return {
          _id: chat._id,
          sender,
          lastMessage: chat.lastMessage,
          unreadMessagesCount: chat.unreadMessagesCount,
        };
      })
    );

    res.status(200).json(filteredChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
};

// checks if a user has unread chats
const hasUnreadChats = async (req, res) => {
  const { userId } = req.params;
  try {
    const hasUnreadChats = await Chat.exists({
      members: { $in: [userId] },
      unreadMessagesCount: { $gt: 0 },
      "lastMessage.senderId": { $ne: userId },
    });

    res.status(200).json({ hasUnreadChats: Boolean(hasUnreadChats) });
  } catch (error) {
    console.error("Error checking unread chats:", error);
    res.status(500).json({ error: "Failed to check unread chats" });
  }
};

export { createChat, getChats, hasUnreadChats };
