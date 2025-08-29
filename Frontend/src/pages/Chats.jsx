import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/userContext";
import axios from "axios";
import { format } from "timeago.js";
import CircleIcon from "@mui/icons-material/Circle";
import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import socket from "../socketConnection";
import ChatSkeleton from "../components/skeletons/ChatSkeleton";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";
import CreateGroupModal from "../components/CreateGroupModal";

const Chats = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("private");
  const [isLoading, setIsLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (activeTab === "private") {
          const response = await axios.get(`${API_URL}/api/chats/${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setChats(response.data);
        } else {
          const response = await axios.get(`${API_URL}/api/groups`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setGroups(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const privateListener = () => {
      if (activeTab === "private") fetchData();
    };

    const groupListener = () => {
      if (activeTab === "groups") fetchData();
    };

    socket.on("getMessage", privateListener);
    socket.on("groupUpdate", groupListener);

    return () => {
      socket.off("getMessage", privateListener);
      socket.off("groupUpdate", groupListener);
    };
  }, [user._id, activeTab, token]);

  const refreshGroups = () => {
    axios.get(`${API_URL}/api/groups`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => setGroups(response.data))
    .catch(error => console.error("Failed to refresh groups:", error));
  };

  return (
    <div className="h-[100%] shadow-md bg-white dark:bg-[#101010] dark:text-white rounded-lg">
      <div className="p-4 flex justify-between items-center">
        <h4 className="font-bold text-2xl">Chats</h4>
        {activeTab === "groups" && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
          >
            <GroupsIcon fontSize="small" /> New Group
          </button>
        )}
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b dark:border-gray-700">
        <button
          className={`flex-1 py-2 font-medium ${activeTab === "private" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400"}`}
          onClick={() => setActiveTab("private")}
        >
          Private Chats
        </button>
        <button
          className={`flex-1 py-2 font-medium ${activeTab === "groups" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-500 dark:text-gray-400"}`}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>
      </div>

      <div className="overflow-hidden overflow-y-scroll scroll-smooth scrollbar-thin pl-2 h-[85%]">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <ChatSkeleton key={index} />
          ))
        ) : activeTab === "private" ? (
          chats.length > 0 ? (
            chats.map((chat) => (
              <ChatItem key={chat._id} chat={chat} sender={chat.sender} />
            ))
          ) : (
            <EmptyState message="No conversations yet. Start chatting with someone today!" />
          )
        ) : groups.length > 0 ? (
          groups.map((group) => (
            <GroupItem 
              key={group._id} 
              group={group} 
              currentUserId={user._id}
              token={token}
            />
          ))
        ) : (
          <EmptyState message="No groups yet. Create or join a group to start chatting!" />
        )}
      </div>

      <CreateGroupModal 
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        refreshGroups={refreshGroups}
      />
    </div>
  );
};

const ChatItem = ({ chat, sender }) => {
  const { user: currentUser } = useContext(UserContext);
  const isBlocked = currentUser.blockedUsers.includes(sender._id);
  const { onlineUsers } = useContext(OnlineUsersContext);

  return (
    <>
      {chat.lastMessage && (
        <div>
          <Link
            to={`/chats/${chat._id}/${sender._id}`}
            className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#202020] px-4 py-3"
          >
            <div className="flex gap-4 items-center w-full">
              <img
                src={sender.profilePicture || assets.noAvatar}
                className="block h-12 w-12 rounded-full object-cover"
                alt="sender image"
              />
              <div>
                <div className="flex gap-2 items-center">
                  <p className="text-lg">
                    {sender.username} {isBlocked && <span className="opacity-50"><BlockIcon /></span>}
                  </p>
                  {onlineUsers.includes(sender._id) && <div className="mt-0.5 h-2.5 w-2.5 bg-green-500 rounded-full"></div>}
                </div>
                <p className="opacity-60 text-sm">
                  {isBlocked ? "You blocked this user" : <span>
                    {chat.lastMessage.content.length > 50 ?
                      <>{chat.lastMessage.content.substring(0,36)}...</>
                      : chat.lastMessage.content
                    } 
                    {" "}<CircleIcon sx={{ fontSize: 4 }} />{" "}
                    {format(chat.lastMessage.createdAt)}
                  </span>}
                </p>
              </div>
            </div>
            {chat.unreadMessagesCount > 0 &&
              chat.lastMessage.senderId !== currentUser._id && (
                <div className="h-6 w-6 flex items-center justify-center text-center rounded-full bg-blue-500 text-white text-sm font-semibold shadow-md">
                  {chat.unreadMessagesCount}
                </div>
              )}
          </Link>
          <hr className="border border-black dark:border-white opacity-15" />
        </div>
      )}
    </>
  );
};

const GroupItem = ({ group, currentUserId, token }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [lastMessage, setLastMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [messageRes, unreadRes] = await Promise.all([
          axios.get(`${API_URL}/api/groups/${group._id}/messages/last`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/groups/${group._id}/unread`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        
        setLastMessage(messageRes.data);
        setUnreadCount(unreadRes.data.count);
      } catch (error) {
        console.error("Failed to fetch group data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    const messageListener = (newMessage) => {
      if (newMessage.group === group._id) {
        setLastMessage(newMessage);
        if (newMessage.sender._id !== currentUserId) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    socket.on("groupMessage", messageListener);
    return () => socket.off("groupMessage", messageListener);
  }, [group._id, currentUserId, token]);

  if (isLoading) return <ChatSkeleton />;

  return (
    <div>
      <Link
        to={`/groups/${group._id}`}
        className="flex items-center justify-between hover:bg-gray-100 dark:hover:bg-[#202020] px-4 py-3"
      >
        <div className="flex gap-4 items-center w-full">
          <img
            src={group.avatar || assets.noAvatar}
            className="block h-12 w-12 rounded-full object-cover"
            alt="group avatar"
          />
          <div>
            <div className="flex gap-2 items-center">
              <p className="text-lg">{group.name}</p>
            </div>
            <p className="opacity-60 text-sm">
              {lastMessage ? (
                <>
                  {lastMessage.sender._id === currentUserId && "You: "}
                  {lastMessage.content?.length > 50 ?
                    <>{lastMessage.content.substring(0,36)}...</>
                    : lastMessage.content
                  } 
                  {" "}<CircleIcon sx={{ fontSize: 4 }} />{" "}
                  {format(lastMessage.createdAt)}
                </>
              ) : "No messages yet"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="h-6 w-6 flex items-center justify-center text-center rounded-full bg-blue-500 text-white text-sm font-semibold shadow-md">
            {unreadCount}
          </div>
        )}
      </Link>
      <hr className="border border-black dark:border-white opacity-15" />
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="h-full px-5 flex items-center justify-center dark:text-white">
    <div className="text-center">
      <p className="text-xl font-medium mb-2">No {message.includes("group") ? "groups" : "conversations"} yet.</p>
      <p className="text-lg opacity-80">{message}</p>
    </div>
  </div>
);

export default Chats;