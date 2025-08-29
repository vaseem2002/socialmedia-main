import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  MoreHoriz as MoreIcon,
  FavoriteBorderOutlined as NotLikeIcon,
  Favorite as LikeIcon,
  SmsOutlined as CommentIcon,
  Share as ShareIcon,
  BookmarkBorderOutlined as NotSaveIcon,
  Bookmark as SaveIcon,
} from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import { UserContext } from "../context/userContext";
import axios from "axios";
import { format } from "timeago.js";
import CommentsModal from "./CommentsModal";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import socket from "../socketConnection";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";

const Post = ({ post, user, deletePost }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user: currentUser } = useContext(UserContext);
  const { token } = useContext(AuthContext);
  const { onlineUsers } = useContext(OnlineUsersContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [likes, setLikes] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(post.likes.includes(currentUser._id));
  const [isSaved, setIsSaved] = useState(post.saves.includes(currentUser._id));
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const blocked = user.blockedUsers.includes(currentUser._id) || currentUser.blockedUsers.includes(user._id)

  const handleLike = async () => {
    try {
      setIsLiked(!isLiked);
      setLikes(isLiked ? likes - 1 : likes + 1);

      await axios.put(`${API_URL}/api/posts/${post._id}/like`, 
        { userId: currentUser._id }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // If the current user liked the post and they are not the post owner
      if (!isLiked && currentUser._id !== user._id) {
        const notification = {
          userId: user._id,
          senderId: currentUser._id,
          content: `has liked your post.`,
          sender: { username: currentUser.username, profilePicture: currentUser.profilePicture }
        };
        // send notification to post owner
        await axios.post(`${API_URL}/api/notifications`, 
          notification, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // if user is online, send socket notification
        if (onlineUsers.includes(user._id)) {
          socket.emit("sendNotification", { recieverId: user._id, notification });
        }
      }
    } catch (error) {
      console.error("Error liking the post:", error.message);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaved(!isSaved);
      await axios.put(`${API_URL}/api/posts/${post._id}/save`, 
        { userId: currentUser._id }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error saving the post:", error.message);
    }
  };

  return (
    <>
      {/* Show post only if the user is not blocked */}
      {!blocked && (
        <div className="bg-white mb-5 p-3 sm:p-4 rounded-lg shadow dark:bg-[#101010] dark:text-white">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/userProfile/${user._id}`}>
                <img
                  src={user.profilePicture || assets.noAvatar}
                  alt=""
                  className="block h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
                />
              </Link>
              <div>
                <p>{user.username}</p>
                <p className="text-[0.7rem] opacity-70">
                  posted {format(post.createdAt)}
                </p>
              </div>
            </div>
            <div className="relative">
              <MoreIcon
                className="hover:opacity-70 cursor-pointer align-top"
                onClick={() => {
                  if (user._id === currentUser._id) setMenuOpen(!menuOpen);
                }}
              />
              {menuOpen && (
                <button
                  className="absolute top-5 right-0 bg-gray-200 dark:bg-[#202020] dark:text-white p-1 px-2 text-center text-sm rounded"
                  onClick={async () => {
                    setIsDeleting(true);
                    await deletePost(post._id)
                    setIsDeleting(false);
                  }}>
                  {isDeleting ? (
                    <span className="flex items-center gap-1">
                      Deleting <CircularProgress size={12} color="inherit" />
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              )}
            </div>
          </div>

          {post.mediaType === "image" && (
            <div className="pt-3">
              <img
                src={post.mediaUrl}
                className="block w-full object-cover rounded"
                alt="postImage"
              />
            </div>
          )}

          {post.mediaType === "video" && (
            <div>
              <div className="pt-3">
                <video
                  src={post.mediaUrl}
                  className="block w-full rounded"
                  controls
                />
              </div>
            </div>
          )}

          {post.caption && <p className="text-sm mt-2 p-1 leading-tight">{post.caption}</p>}

          <div className="flex justify-between pt-3">
            <div className="flex justify-start gap-5">
              <div
                className="flex gap-1.5 items-center hover:opacity-70"
                onClick={handleLike}
              >
                {isLiked ? (
                  <LikeIcon className="text-red-500" />
                ) : (
                  <NotLikeIcon />
                )}
                <p className="text-sm">{likes}</p>
              </div>
              <div onClick={() => { setIsModalOpen(true) }}
                className="flex gap-2 items-center hover:opacity-70"
              >
                <CommentIcon className="mt-0.5" />
                <p className="text-sm">{commentCount}</p>
              </div>
              <div className="flex items-center hover:opacity-70">
                <ShareIcon fontSize="small" />
              </div>
            </div>
            <div onClick={handleSave}
              className="mt-0.5 flex items-center hover:opacity-70"
            >
              {isSaved ? <SaveIcon /> : <NotSaveIcon />}
            </div>
          </div>
          {isModalOpen && <CommentsModal
            closeModal={() => {setIsModalOpen(false)}}
            post={post}
            increaseCount={() => {setCommentCount(commentCount + 1)}}
            decreaseCount={() => {setCommentCount(commentCount - 1)}}
          />}
        </div>
      )}
    </>
  );
};

export default Post;
