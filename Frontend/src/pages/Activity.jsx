import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/userContext";
import axios from "axios";
import Notification from "../components/Notification";
import { v4 as uuidv4 } from "uuid";
import socket from "../socketConnection";
import FollowRequests from "../components/FollowRequests";
import NotificationSkeleton from "../components/skeletons/NotificationSkeleton";
import { AuthContext } from "../context/authContext";

const Activity = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/notifications/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNotifications(response.data);
      } catch (error) {
        console.error("Error fetching notifications:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotifications();

     // Add socket listener for group messages
  socket.on("newGroupMessage", ({ notification }) => {
    setNotifications(prev => [{
      ...notification,
      _id: Date.now().toString(), // Temporary ID for frontend
      type: "group-message",
      createdAt: new Date()
    }, ...prev]);
  });

    socket.on("getNotification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });
    return () => {
      socket.off("newGroupMessage");
      socket.off("getNotification");
  };
  }, [user._id]);
  

  useEffect(() => {
    const markAsRead = async () => {
      try {
        const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
        if(unreadIds.length === 0) return;

        await axios.put(`${API_URL}/api/notifications/mark-as-read`, 
          { notificationIds: unreadIds }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        socket.emit("refetchUnreadNotifications", {userId: user._id});
      } catch (error) {
        console.error("Error marking notifications as read:", error.message);
      }
    };
    markAsRead();
  }, [notifications, user._id]);

  return (
    <div className="h-[100%] shadow-md bg-white dark:bg-[#101010] dark:text-white rounded-lg">
      <div className="p-4 flex justify-center items-center">
        <h4 className="font-bold text-2xl">Recent Activity</h4>
      </div>
      <hr className="border border-black dark:border-white opacity-15" />
      <div className="sm:hidden"><FollowRequests /></div>
      <div className="overflow-y-scroll scroll-smooth scrollbar-thin pl-2 h-[85%]">
        {isLoading
          ? Array.from({ length: 15 }).map((_, index) => (
            <NotificationSkeleton key={index} />
          ))
          : notifications.length > 0 ? notifications.map((notification) => (
            <Notification 
              key={uuidv4()} 
              sender={notification.sender}
              content={notification.content}
              isRead={notification.isRead}
              createdAt={notification.createdAt}
            />
          ))
          : <div className="h-full px-5 flex items-center justify-center dark:text-white">
              <div className="text-center">
                <p className="text-2xl font-medium mb-2">No notifications at the moment.</p>
                <p className="text-lg opacity-80">Explore and engage with others to get updates here!</p>
              </div>
            </div>}
      </div>
    </div>
  );
};

export default Activity;
