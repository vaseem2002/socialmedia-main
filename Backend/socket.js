import { Server } from "socket.io";

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173" },
  });

  let userSocketMap = new Map(); //  userId -> socketId 
  let activeUsersInChat = {};  // chatId -> Set of userIds

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    

    socket.on("addUser", (userId) => {
      if (!userSocketMap.has(userId)) {
        userSocketMap.set(userId, socket.id); 
      }
      io.emit("getUsers", Array.from(userSocketMap.keys())); 
    });

    socket.on("removeUser", (userId) => {
      console.log("User logged out:", userId);
      userSocketMap.delete(userId); 
      io.emit("getUsers", Array.from(userSocketMap.keys()));
    });

    socket.on("sendMessage", ({ senderId, recieverId, content }) => {
      const recieverSocketId = userSocketMap.get(recieverId);
      if (recieverSocketId) {
        io.to(recieverSocketId).emit("getMessage", { senderId, content });
      }
    });

    socket.on("sendNotification", ({ recieverId, notification }) => {
      const recieverSocketId = userSocketMap.get(recieverId);
      if (recieverSocketId) {
        notification.createdAt = Date.now();
        io.to(recieverSocketId).emit("getNotification", notification);
      }
    });

    socket.on("follow", ({ targetUserId, sourceUserId }) => {
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("getFollowed", sourceUserId);
      }
    });

    socket.on("unfollow", ({ targetUserId, sourceUserId }) => {
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("getUnfollowed", sourceUserId);
      }
    });

    socket.on("sendRequest", ({ targetUserId, sourceUserId }) => {
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("getRequest", sourceUserId);
      }
    });

    socket.on("acceptRequest", ({ targetUserId, sourceUserId }) => {
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("getRequestAccepted", sourceUserId);
      }
    });

    socket.on("rejectRequest", ({ targetUserId, sourceUserId }) => {
      const targetSocketId = userSocketMap.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit("getRequestRejected", sourceUserId);
      }
    });

    socket.on("joinChatPage", ({ userId, chatId }) => {
      if (!activeUsersInChat[chatId]) {
        activeUsersInChat[chatId] = new Set();
      }
      activeUsersInChat[chatId].add(userId);

      io.emit("activeUsersInChat", Array.from(activeUsersInChat[chatId]));
    });

    socket.on("leaveChatPage", ({ userId, chatId }) => {
      if (activeUsersInChat[chatId]) {
        activeUsersInChat[chatId].delete(userId); 

        if (activeUsersInChat[chatId].size === 0) {
          delete activeUsersInChat[chatId];
        }
      }

      io.emit("activeUsersInChat", Array.from(activeUsersInChat[chatId] || []));
    });

    socket.on("refetchUnreadChats", ({ userId }) => {
      const userSocketId = userSocketMap.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("checkUnreadChats");
      }
    });

    socket.on("refetchUnreadNotifications", ({ userId }) => {
      const userSocketId = userSocketMap.get(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("checkUnreadNotifications");
      }
    });

    // Join group rooms when user connects
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
    });
  
    socket.on("leaveGroup", (groupId) => {
      socket.leave(groupId);
    });
  
    socket.on("groupMessage", (message) => {
      io.to(message.group).emit("groupMessage", message);
    });
  
    socket.on("markGroupMessagesRead", ({ groupId, userId }) => {
      io.to(groupId).emit("messageRead", { messageId, userId });
    });



    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);

      for (let [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
          break;
        }
      }

      io.emit("getUsers", Array.from(userSocketMap.keys()));
    });

  });
};

export default initializeSocket;