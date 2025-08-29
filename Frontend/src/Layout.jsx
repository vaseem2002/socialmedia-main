import React, { useContext, useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { UserContext } from "./context/userContext.jsx";
import { SidebarProvider } from "./context/sideBarContext.jsx";
import TopBar from "./components/TopBar";
import LeftBar from "./components/LeftBar";
import RightBar from "./components/RightBar";
import socket from "./socketConnection.js";
import axios from "axios";
import { toast } from "react-toastify";
import axioxInstance from "./utils/axiosInstance";

const Layout = () => {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const { user, dispatch } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndFetchUser = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("token")?.trim();
        if (!token) {
          console.log('No token in localStorage');
          navigate("/login");
          return;
        }
  
        // Debug: Print token before sending
        console.log('Token being sent:', token);
  
        // Verify token
        const verifyResponse = await axioxInstance.get(`${API_URL}/api/auth/verify`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          // Add these to ensure headers are sent
          withCredentials: true,
          transformRequest: [(data, headers) => {
            if (!headers['Authorization']) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            return data;
          }]
        });
  
        // Debug: Print verification response
        console.log('Verify response:', verifyResponse.data);
  
        // Fetch user data
        const userResponse = await axioxInstance.get(
          `${API_URL}/api/users/${verifyResponse.data.userId}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );
  
        // Update context and socket
        dispatch({ type: "LOGIN_SUCCESS", payload: userResponse.data });
        socket.emit("addUser", userResponse.data._id);
      } catch (error) {
        console.error("Authentication error:", error);
        
        if (error.response) {
          console.error("Response data:", error.response.data);
          console.error("Response status:", error.response.status);
          console.error("Response headers:", error.response.headers);
        }
        
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
  
    verifyAndFetchUser();
  }, [API_URL, dispatch, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <TopBar />
      <div className="h-[calc(100vh-50px)] sm:h-[calc(100vh-58px)] grid grid-cols-16 bg-gray-100 dark:bg-[#171717]">
        <LeftBar />
        <div className="p-3 lg:p-5 lg:px-7 overflow-y-scroll scroll-smooth no-scrollbar col-span-full sm:col-span-10 lg:col-span-8">
          <Outlet />
        </div>
        <RightBar />
      </div>
    </SidebarProvider>
  );
};

export default Layout;