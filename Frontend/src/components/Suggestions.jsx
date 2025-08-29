import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/userContext";
import { ThemeContext } from "../context/themeContext";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import axios from "axios";
import socket from "../socketConnection";
import { toast } from "react-toastify";
import SuggestionsSkeleton from "./skeletons/SuggestionsSkeleton";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";

const Suggestions = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/suggestions/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setSuggestions(response.data);
      } catch (error) {
        console.error("Error fetching suggestions:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggestions();
  }, [user._id]);

  if (isLoading) return <SuggestionsSkeleton />

  return (
    <>
      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 pb-5 mb-5 dark:bg-[#101010] dark:text-white">
          <p className="opacity-70">Suggestions for you</p>
          {suggestions.map((user) => {
            return <Suggestion key={user._id} user={user} />;
          })}
        </div>
      )}
    </>
  );
};

const Suggestion = ({ user }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user: currentUser, dispatch } = useContext(UserContext);
  const { theme } = useContext(ThemeContext)
  const { onlineUsers } = useContext(OnlineUsersContext);
  const [followStatus, setFollowStatus] = useState(() =>
    currentUser.requestedTo.includes(user._id) ? "Requested" :
    currentUser.following.includes(user._id) ? "Unfollow" : "Follow"
  );

  useEffect(() => {
    setFollowStatus(
      currentUser.requestedTo.includes(user._id) 
      ? "Requested" :
      currentUser.following.includes(user._id) 
      ? "Unfollow" : "Follow"
    )
  }, [currentUser.following, currentUser.requestedTo]);

  const handleFollowStatus = async () => {
    try {
      if (currentUser.requestedTo.includes(user._id)) return;
      if (!currentUser.following.includes(user._id)) {
        // Follow user
        setFollowStatus(user.isPrivate ? "Requested" : "Unfollow");

        await axios.put(`${API_URL}/api/users/${user._id}/follow`, 
          { userId: currentUser._id }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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
          { userId: currentUser._id }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
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
    <div className="flex mt-4 items-center justify-between">
      <div className="flex gap-2 items-center">
        <img
          src={user.profilePicture || assets.noAvatar}
          alt="userImage"
          className="block h-9 w-9 rounded-full object-cover"
        />
        <div>
          <p>{user.username}</p>
          {user.mutualFriends > 0 && <p className="opacity-70 text-[0.75rem]">
            {user.mutualFriends} mutual Friends
          </p>}
        </div>
      </div>
      <button
        onClick={handleFollowStatus}
        className={`p-1.5 w-[100px] font-semibold transition-colors duration-200 ${
          followStatus === "Follow"
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : "bg-gray-200 dark:bg-[#202020] hover:bg-gray-300 hover:dark:bg-[#252525]"
        } rounded-md`}
      >
        {followStatus}
      </button>
    </div>
  );
};

export default Suggestions;
