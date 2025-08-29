import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { ThemeContext } from "../context/themeContext";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import axios from "axios";
import socket from "../socketConnection";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";

const UserCard = ({ user, closeModal }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user: currentUser, dispatch } = useContext(UserContext);
  const { onlineUsers } = useContext(OnlineUsersContext);
  const { theme } = useContext(ThemeContext);
  const [followStatus, setFollowStatus] = useState(() =>
    currentUser.requestedTo.includes(user._id) ? "Requested" :
    currentUser.following.includes(user._id) ? "Unfollow" : "Follow"
  );

  const handleFollowStatus = async () => {
    try {
      if (currentUser.requestedTo.includes(user._id)) return;
      if (!currentUser.following.includes(user._id)) {
        // Follow user
        setFollowStatus(user.isPrivate ? "Requested" : "Unfollow");

        await axios.put(`${API_URL}/api/users/${user._id}/follow`, 
          { userId: currentUser._id }, { headers: {token} }
        );
        dispatch({ type: user.isPrivate ? "SEND_REQUEST" : "FOLLOW", payload: user._id });

        const notification = {
          userId: user._id,
          senderId: currentUser._id,
          content: user.isPrivate ? "has requested to follow you." : "has started following you.",
          sender: { username: currentUser.username, profilePicture: currentUser.profilePicture }
        };

        await axios.post(`${API_URL}/api/notifications`, 
          notification, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (onlineUsers.includes(user._id)) {
          socket.emit(user.isPrivate ? "sendRequest" : "follow", { 
            targetUserId: user._id, 
            sourceUserId: currentUser._id
          });
          socket.emit("sendNotification", { recieverId: user._id, notification });
        }

      } else {
        // Unfollow user
        setFollowStatus("Follow");

        await axios.put(`${API_URL}/api/users/${user._id}/unfollow`, 
          { userId: currentUser._id }, { headers: {token} }
        );
        dispatch({ type: "UNFOLLOW", payload: user._id });

        if (onlineUsers.includes(user._id)) {
          socket.emit("unfollow", { targetUserId: user._id, sourceUserId: currentUser._id });
        }
      }
    } catch (error) {
      console.error("Error handling follow status:", error.message);
      toast.error("Something went wrong. Please try again.", { theme });
    }
  };

  return (
    <div className="flex mb-4 items-center justify-between">
      <div className="flex gap-4 items-center">
        <Link onClick={closeModal} to={`/userProfile/${user._id}`}>
          <img
            src={user.profilePicture || assets.noAvatar}
            className="block h-10 w-10 rounded-full object-cover"
            alt="user image"
          />
        </Link>

        <p className="font-medium">{user.username}</p>
      </div>
      {currentUser._id !== user._id && (
        <button
          onClick={handleFollowStatus}
          className={`p-2 w-[100px] font-semibold transition-colors duration-200 ${followStatus === "Follow" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-200 dark:bg-[#202020] hover:bg-gray-300 hover:dark:bg-[#252525]"} rounded-md`}
        >
          {followStatus}
        </button>
      )}
    </div>
  );
};

export default UserCard;
