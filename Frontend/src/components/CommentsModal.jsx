import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../context/userContext";
import { ThemeContext } from "../context/themeContext";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import Comment from "./Comment";
import { Close as CloseIcon, Send as SendIcon } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import { assets } from "../assets/assets";
import axios from "axios";
import socket from "../socketConnection";
import { toast } from "react-toastify";
import CommentSkeleton from "./skeletons/CommentSkeleton";
import { AuthContext } from "../context/authContext";

const CommentsModal = ({ closeModal, post, increaseCount, decreaseCount }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { onlineUsers } = useContext(OnlineUsersContext);
  const { theme } = useContext(ThemeContext);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const commentText = useRef();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/comments/${post._id}`, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setComments(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching comments:", error.message);
      }
    };
    fetchComments();
  }, [post._id]);

  const addComment = async (event) => {
    event.preventDefault();
    if (commentText.current.value.trim() === "") return;

    setIsSending(true);
    const newComment = {
      userId: user._id,
      postId: post._id,
      text: commentText.current.value,
    };
    try {
      const response = await axios.put(`${API_URL}/api/comments`, 
        newComment, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setComments((prev) => [response.data, ...prev]);
      increaseCount();
      commentText.current.value = "";
      // Send notification if the commenter is not the post owner
      if (user._id !== post.userId) {
        const notification = {
          userId: post.userId,
          senderId: user._id,
          content: "has commented on your post.",
          sender: { username: user.username, profilePicture: user.profilePicture }
        };
        try {
          await axios.post(`${API_URL}/api/notifications`, 
            notification, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (onlineUsers.includes(post.userId)) {
            socket.emit("sendNotification", { recieverId: post.userId, notification });
          }
        } catch (notifError) {
          console.error("Error sending notification:", notifError.message);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error.message);
      toast.error("Failed to add comment", { theme });
    } finally {
      setIsSending(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await axios.delete(`${API_URL}/api/comments/${commentId}`, 
        { data: { userId: user._id },  headers: {
          Authorization: `Bearer ${token}`,
        }});
      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
      decreaseCount();
      toast.info("Comment removed successfully", { theme });
    } catch (error) {
      console.error("Error deleting comment:", error.message);
      toast.error("Failed to delete comment", { theme });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-30 dark:bg-opacity-70 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#101010] rounded-lg dark:text-white">
          <div className="p-4 flex justify-between items-center">
            <h4 className="font-medium text-lg">Comments</h4>
            <CloseIcon onClick={closeModal} className="hover:opacity-60" />
          </div>
          <hr className="border border-black dark:border-white opacity-15" />

          <div className="p-4 overflow-y-scroll scroll-smooth h-[65vh] w-[90vw] sm:w-[60vw] md:w-[50vw] lg:w-[40vw]  scrollbar-thin">
            {isLoading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <CommentSkeleton key={index} />
              ))
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <Comment
                  key={comment._id}
                  comment={comment}
                  post={post}
                  user={comment.user}
                  deleteComment={removeComment}
                />
              ))
            ) : (
              <div className="h-full w-full flex justify-center items-center">
                <div className="text-center">
                  <p className="text-xl font-bold">No Comments Yet.</p>
                  <p className="opacity-60">Be the first one to comment.</p>
                </div>
              </div>
            )}
          </div>

          <hr className="border border-black dark:border-white opacity-15" />

          <div className="p-4">
            <form onSubmit={addComment} className="flex gap-3 justify-between items-center">
              <img
                src={user.profilePicture || assets.noAvatar}
                alt=""
                className="block h-9 w-9 rounded-full object-cover shadow"
                crossOrigin="anonymous"
              />
              <input
                type="text"
                placeholder="Write your comment here..."
                className="block w-full border border-gray-300 bg-transparent outline-none shadow rounded p-2 text-sm dark:border-opacity-40"
                ref={commentText}
              />
              <button
                type="submit"
                className="flex justify-center items-center p-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                {isSending
                 ? <CircularProgress className="text-center" size={24} color="inherit"/> 
                 : <SendIcon />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommentsModal;
