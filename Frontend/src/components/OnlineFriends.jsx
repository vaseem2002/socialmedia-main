import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/userContext";
import axios from "axios";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import OnlineFriendsSkeleton from "./skeletons/OnlineFriendsSkeleton";
import { assets } from "../assets/assets";

const OnlineFriends = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { user } = useContext(UserContext);
  const { onlineUsers } = useContext(OnlineUsersContext);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/following/${user._id}`);
        const friends = response.data;
        setOnlineFriends(friends.filter((friend) => 
          onlineUsers.includes(friend._id) &&
          !user.blockedUsers.includes(friend._id) &&
          !friend.blockedUsers.includes(user._id))
        );
      } catch (error) {
        console.error("Error fetching friends:", error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFriends();
  }, [user, onlineUsers]);

  if (isLoading) return <OnlineFriendsSkeleton />

  return (
    <>
      {onlineFriends.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-5 dark:bg-[#101010] dark:text-white">
          <div className="flex items-center gap-2">
            <p className="opacity-70">Online Friends</p>
            <div className="mt-0.5 h-2.5 w-2.5 bg-green-500 rounded-full"></div>
          </div>
          {onlineFriends.map((friend) => {
            return <OnlineFriend friend={friend} key={friend._id} />;
          })}
        </div>
      )}
    </>
  );
};

const OnlineFriend = ({ friend }) => {

  return (
    <div className="flex mt-4 items-center justify-between">
      <div className="flex gap-4 items-center">
        <img
          src={friend.profilePicture || assets.noAvatar}
          alt="userImage"
          className="block h-9 w-9 rounded-full object-cover"
        />
        <p>{friend.username}</p>
      </div>
    </div>
  );
};

export default OnlineFriends;
