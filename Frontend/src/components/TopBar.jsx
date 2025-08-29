import React, { useContext, useEffect, useState } from "react";
import {
  GridViewOutlined,
  CloseOutlined,
  DarkMode,
  LightMode,
  SearchOutlined,
  EmailOutlined,
  NotificationsOutlined,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { ThemeContext } from "../context/themeContext";
import { UserContext } from "../context/userContext";
import { SidebarContext } from "../context/sideBarContext";
import axios from "axios";
import socket from "../socketConnection";
import { assets } from "../assets/assets";
import { AuthContext } from "../context/authContext";
import logo from "../assets/logo.png";

const TopBar = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { theme, changeTheme } = useContext(ThemeContext);
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { isOpen, toggleBar } = useContext(SidebarContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [unreadChats, setUnreadChats] = useState(false);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/${user._id}/has-unread`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUnreadNotifications(response.data.hasUnreadNotifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error.message);
    }
  }
  
  const fetchUnreadChats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/chats/${user._id}/has-unread`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUnreadChats(response.data.hasUnreadChats);
    } catch (error) {
      console.error("Error fetching unread chats:", error.message);
    }
  }

  useEffect(() => {
    fetchUnreadNotifications();
    fetchUnreadChats();
  }, [user._id]);

  useEffect(() => {
    socket.on("getNotification", fetchUnreadNotifications);
    socket.on("getMessage", fetchUnreadChats); 
    socket.on("checkUnreadNotifications", fetchUnreadNotifications);
    socket.on("checkUnreadChats", fetchUnreadChats);
    return () => {
      socket.off("getNotification", fetchUnreadNotifications);
      socket.off("getMessage", fetchUnreadChats);
      socket.off("checkUnreadNotifications", fetchUnreadNotifications);
      socket.off("checkUnreadChats", fetchUnreadChats);
    }
  }, [fetchUnreadChats, fetchUnreadNotifications]);

  const handleSearch = async (event) => {
    const { value: query } = event.target;
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/users/search?username=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error fetching search results: ", error.message);
      setSearchResults([]);
    }
  };

  if (!user) {
    return (
      <div className="h-16 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-between px-6">
        <div className="animate-pulse h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="flex bg-white dark:bg-gray-900 items-center justify-between px-6 py-3 shadow-sm sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      {/* Left section - Logo and search */}
      <div className="flex items-center space-x-5 w-full max-w-3xl">
        {/* Mobile menu button */}
        <button 
          onClick={toggleBar}
          className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors duration-200"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <CloseOutlined className="text-2xl" />
          ) : (
            <GridViewOutlined className="text-2xl" />
          )}
        </button>

        {/* Logo */}
        <Link 
          to="/" 
          className="hidden sm:block transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <img 
            src={logo} 
            alt="Connectify Logo"
            className="h-9 w-auto object-contain"
          />
        </Link>

        {/* Search bar */}
        <div className="relative flex-1">
          <div className="flex items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl focus-within:bg-white dark:focus-within:bg-gray-700 focus-within:ring-2 focus-within:ring-amber-500 focus-within:shadow-lg transition-all duration-300">
            <SearchOutlined className="text-gray-500 dark:text-gray-400 mr-3 text-xl" />
            <input
              type="text"
              placeholder="Search users, posts, or groups..."
              className="w-full bg-transparent border-none outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in">
              {searchResults.map((result) => (
                <SearchResult
                  key={result._id}
                  user={result}
                  closeResults={() => {
                    setSearchResults([]);
                    setSearchQuery([]);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section - Icons and profile */}
      <div className="flex items-center space-x-5">
        {/* Theme toggle */}
        <button 
          onClick={changeTheme}
          className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors duration-200"
          aria-label={`Toggle ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === "light" ? (
            <DarkMode className="text-2xl" />
          ) : (
            <LightMode className="text-2xl" />
          )}
        </button>

        {/* Messages */}
        <Link 
          to="/chats" 
          className="p-2.5 relative rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors duration-200 group"
        >
          <EmailOutlined className="text-2xl" />
          {unreadChats && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></div>
          )}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </Link>

        {/* Notifications */}
        <Link 
          to="/activity" 
          className="p-2.5 relative rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors duration-200 group"
        >
          <NotificationsOutlined className="text-2xl" />
          {unreadNotifications && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
          )}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </Link>

        {/* Profile picture */}
        <Link 
          to={`/userProfile/${user._id}`} 
          className="hidden sm:block group relative"
        >
          <div className="relative">
            <img
              src={user.profilePicture || assets.noAvatar}
              alt="Profile"
              className="h-9 w-9 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md group-hover:border-amber-400 transition-all duration-300"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-amber-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </Link>
      </div>
    </div>
  );
};

const SearchResult = ({ user, closeResults }) => {
  return (
    <Link
      onClick={closeResults}
      to={`/userProfile/${user._id}`}
      className="flex items-center px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-0"
    >
      <img
        src={user.profilePicture || assets.noAvatar}
        className="h-11 w-11 rounded-xl object-cover mr-4 border border-gray-200 dark:border-gray-600"
        alt={user.username}
      />
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{user.username}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {user.fullName || "Connectify User"}
        </p>
      </div>
    </Link>
  );
};

export default TopBar;