import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_WS_URL);

export const connectSocket = (user) => {
    if (!socket.connected) {
      socket.auth = { userId: user._id };
      socket.connect();
    }
  };
  
  export const setupGroupSocketListeners = (setGroups, setMessages) => {
    socket.on("groupMessage", (message) => {
      setMessages(prev => [...prev, message]);
    });
  
    socket.on("messageRead", ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId && !msg.readBy.includes(userId)
          ? { ...msg, readBy: [...msg.readBy, userId] }
          : msg
      ));
    });
  
    socket.on("groupUpdate", (updatedGroup) => {
      setGroups(prev => prev.map(group => 
        group._id === updatedGroup._id ? updatedGroup : group
      ));
    });
  };
  
  export const joinGroupRoom = (groupId) => {
    socket.emit("joinGroup", groupId);
  };
  
  export const leaveGroupRoom = (groupId) => {
    socket.emit("leaveGroup", groupId);
  };
  
  export const sendGroupMessage = (message) => {
    socket.emit("groupMessage", message);
  };
  
  export const markGroupMessagesRead = ({ groupId, userId }) => {
    socket.emit("markGroupMessagesRead", { groupId, userId });
  };

export default socket;