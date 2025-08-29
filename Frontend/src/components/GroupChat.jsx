// import { useState, useEffect, useRef } from "react";
// import { useParams } from "react-router-dom";
// import { useUser } from "../context/userContext";
// import { 
//   Avatar, 
//   Box, 
//   Button, 
//   IconButton, 
//   TextField, 
//   Typography,
//   Card,
//   CardContent,
//   Divider
// } from "@mui/material";
// import { Send, Image, VideoCameraBack } from "@mui/icons-material";
// // import axios from "axios";
// import axiosInstance from "../utils/axiosInstance";
// import { toast } from "react-toastify";
// import moment from "moment";
// import socket from "../socketConnection";

// const GroupChat = () => {
//   const { groupId } = useParams();
//   const { user } = useUser();
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [group, setGroup] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     fetchGroup();
//     fetchMessages();
//     setupSocket();

//     return () => {
//       // Clean up socket listeners when component unmounts
//       socket.off("groupMessage");
//       socket.off("messageRead");
//     };
//   }, [groupId]);

//   const fetchGroup = async () => {
//     try {
//       const res = await axiosInstance.get(`/api/groups/${groupId}`);
//       setGroup(res.data);
//     } catch (err) {
//       toast.error("Failed to fetch group info");
//     }
//   };

//   const fetchMessages = async () => {
//     try {
//       const res = await axiosInstance.get(`/api/groups/${groupId}/messages`);
//       setMessages(res.data);
//       markMessagesAsRead();
//     } catch (err) {
//       toast.error("Failed to fetch messages");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const setupSocket = () => {
//     socket.emit("joinGroup", groupId);

//     socket.on("groupMessage", (message) => {
//       setMessages(prev => [...prev, message]);
//       scrollToBottom();
      
//       // Mark as read if it's the current user's group
//       if (message.group === groupId) {
//         markMessagesAsRead();
//       }
//     });

//     socket.on("messageRead", ({ messageId, userId }) => {
//       setMessages(prev => prev.map(msg => 
//         msg._id === messageId && !msg.readBy.includes(userId)
//           ? { ...msg, readBy: [...msg.readBy, userId] }
//           : msg
//       ));
//     });
//   };

//   const markMessagesAsRead = async () => {
//     try {
//       await axiosInstance.put(`/api/groups/${groupId}/messages/read`);
//       socket.emit("markGroupMessagesRead", { groupId, userId: user._id });
//     } catch (err) {
//       console.error("Failed to mark messages as read", err);
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!newMessage.trim()) return;

//     try {
//       const res = await axiosInstance.post(`/api/groups/${groupId}/messages`, { 
//         content: newMessage 
//       });
      
//       setMessages(prev => [...prev, res.data]);
//       setNewMessage("");
//       scrollToBottom();
      
//       // Emit socket event
//       socket.emit("groupMessage", res.data);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to send message");
//     }
//   };

//   const handleMediaUpload = async (e, type) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     try {
//       const formData = new FormData();
//       formData.append("media", file);

//       const res = await axiosInstance.post(`/api/groups/${groupId}/messages`, formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       setMessages(prev => [...prev, res.data]);
//       scrollToBottom();
      
//       // Emit socket event
//       socket.emit("groupMessage", res.data);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to upload media");
//     }
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   if (loading) return <Typography>Loading...</Typography>;
//   if (!group) return <Typography>Group not found</Typography>;

//   return (
//     <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
//       <Card sx={{ mb: 2 }}>
//         <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
//           <Avatar src={group.avatar} sx={{ width: 56, height: 56 }} />
//           <Box>
//             <Typography variant="h6">{group.name}</Typography>
//             <Typography variant="body2" color="text.secondary">
//               {group.description}
//             </Typography>
//           </Box>
//         </CardContent>
//       </Card>

//       <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2, p: 1 }}>
//         {messages.map((message) => (
//           <Box
//             key={message._id}
//             sx={{
//               display: "flex",
//               mb: 2,
//               justifyContent: message.sender._id === user._id ? "flex-end" : "flex-start",
//             }}
//           >
//             <Box
//               sx={{
//                 maxWidth: "70%",
//                 bgcolor: message.sender._id === user._id ? "primary.light" : "background.paper",
//                 p: 1.5,
//                 borderRadius: 2,
//                 boxShadow: 1,
//               }}
//             >
//               {message.sender._id !== user._id && (
//                 <Typography variant="subtitle2" color="text.secondary">
//                   {message.sender.username}
//                 </Typography>
//               )}
              
//               {message.media ? (
//                 message.mediaType === "image" ? (
//                   <img 
//                     src={message.media} 
//                     alt="media" 
//                     style={{ maxWidth: "100%", borderRadius: 4 }} 
//                   />
//                 ) : (
//                   <video controls style={{ maxWidth: "100%", borderRadius: 4 }}>
//                     <source src={message.media} type="video/mp4" />
//                   </video>
//                 )
//               ) : (
//                 <Typography>{message.content}</Typography>
//               )}
              
//               <Typography variant="caption" display="block" textAlign="right">
//                 {moment(message.createdAt).format("h:mm A")}
//               </Typography>
//             </Box>
//           </Box>
//         ))}
//         <div ref={messagesEndRef} />
//       </Box>

//       <Box component="form" onSubmit={handleSendMessage} sx={{ display: "flex", gap: 1 }}>
//         <TextField
//           fullWidth
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           placeholder="Type a message..."
//         />
        
//         <input
//           accept="image/*"
//           id="image-upload"
//           type="file"
//           style={{ display: "none" }}
//           onChange={(e) => handleMediaUpload(e, "image")}
//         />
//         <label htmlFor="image-upload">
//           <IconButton component="span">
//             <Image />
//           </IconButton>
//         </label>
        
//         <input
//           accept="video/*"
//           id="video-upload"
//           type="file"
//           style={{ display: "none" }}
//           onChange={(e) => handleMediaUpload(e, "video")}
//         />
//         <label htmlFor="video-upload">
//           <IconButton component="span">
//             <VideoCameraBack />
//           </IconButton>
//         </label>
        
//         <Button type="submit" variant="contained" endIcon={<Send />}>
//           Send
//         </Button>
//       </Box>
//     </Box>
//   );
// };

// export default GroupChat;