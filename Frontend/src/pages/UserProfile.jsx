import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { OnlineUsersContext } from "../context/onlineUsersContext";
import { ThemeContext } from "../context/themeContext";
import FollowersModal from "../components/FollowersModal";
import FollowingModal from "../components/FollowingModal";
import EditProfileModal from "../components/EditProfileModal";
import Post from "../components/Post";
import { Edit as EditIcon, LockOutlined as LockIcon } from "@mui/icons-material";
import { assets } from "../assets/assets";
import axios from "axios";
import socket from "../socketConnection";
import { toast } from "react-toastify";
import UserProfileSkeleton from "../components/skeletons/UserProfileSkeleton";
import { AuthContext } from "../context/authContext";

const UserProfile = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { userId } = useParams();
  const { user: currentUser, dispatch } = useContext(UserContext);
  const { token } = useContext(AuthContext);
  const {onlineUsers} = useContext(OnlineUsersContext);
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [followStatus, setFollowStatus] = useState();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState({ edit: false, followers: false, following: false });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get(`${API_URL}/api/users/${userId}`);
        setUser(userResponse.data);

        const postResponse = await axios.get(`${API_URL}/api/posts/userPosts/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPosts(postResponse.data);

        setFollowStatus(currentUser.requestedTo.includes(userId) ? "Requested" 
        : currentUser.following.includes(userId) ? "Unfollow" : "Follow");
        setIsBlocked(currentUser.blockedUsers.includes(userId));
      } catch (error) {
        console.error("Error fetching user data or posts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId, currentUser]);

  const handleFollowStatus = async () => {
    try {
      if (currentUser.requestedTo.includes(userId)) return;
      if (!currentUser.following.includes(userId)) {
        // Follow user
        setFollowStatus(user.isPrivate ? "Requested" : "Unfollow");

        await axios.put(`${API_URL}/api/users/${userId}/follow`, 
          { userId: currentUser._id }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        dispatch({ type: user.isPrivate ? "SEND_REQUEST" : "FOLLOW", payload: userId });
  
        const notification = {
          userId: userId,
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
  
        if (onlineUsers.includes(userId)) {
          socket.emit(user.isPrivate ? "sendRequest" : "follow", {
            targetUserId: userId,
            sourceUserId: currentUser._id
          });
          socket.emit("sendNotification", { recieverId: userId, notification });
        }
  
      } else {
        // Unfollow user
        setFollowStatus("Follow");

        await axios.put(`${API_URL}/api/users/${userId}/unfollow`, 
          { userId: currentUser._id }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        dispatch({ type: "UNFOLLOW", payload: userId });
  
        if (onlineUsers.includes(userId)) {
          socket.emit("unfollow", { targetUserId: userId, sourceUserId: currentUser._id });
        }
      }
    } catch (error) {
      console.error("Error handling follow status:", error.message);
      toast.error("Something went wrong. Please try again.", { theme });
    }
  };

  const handleBlock = async () => {
    try {
      setIsBlocked(!isBlocked);
      await axios.put(`${API_URL}/api/users/${userId}/block`, 
        { userId: currentUser._id }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if(isBlocked) dispatch({ type: "UNBLOCK", payload: user._id });
      else dispatch({ type: "BLOCK", payload: user._id });
    } catch (error) {
      console.error("Error handling block/unblock action:", error.message);
    }
  };

  const openChat = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/chats`, 
        { senderId: currentUser._id, recieverId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      navigate(`/chats/${response.data._id}/${userId}`);
    } catch (error) {
      console.error("Error opening chat:", error.message);
      toast.error("Failed to open messages", { theme });
    }
  };

  const removePost = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`,
        { data: { userId: currentUser._id } , headers: {token} }
      );
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      toast.info("Post deleted successfully!", { theme });
    } catch (error) {
      console.error("Error deleting post:", error.message);
      toast.error("Failed to delete post. Please try again.", { theme });
    }
  };

  if (isLoading) return <UserProfileSkeleton />;

  return (
    <>
      <div className="relative overflow-y-scroll scroll-smooth no-scrollbar col-span-12 sm:col-span-9 lg:col-span-6">
        <img
          src={user.coverPicture || assets.noCoverPicture}
          alt="coverPicture"
          className="h-[170px] sm:h-[220px] w-full object-cover block rounded"
        />
        <img
          src={user.profilePicture || assets.noAvatar}
          alt="profilePicture"
          className="h-[100px] w-[100px] sm:h-[110px] sm:w-[110px] object-cover rounded-full block absolute top-[120px] sm:top-[160px] left-0 right-0 mx-auto border-2 border-transparent bg-[#eeeeee] dark:bg-[#202020]"
        />

        <div className="w-full lg:w-[85%] mx-auto mt-1 mb-4 p-4 pt-[55px] bg-white dark:bg-[#101010] flex flex-col gap-3 items-center dark:text-white rounded-md shadow">
          <p className="text-2xl font-medium">{user.fullname}</p>
          <div className="flex justify-between gap-10 text-sm font-medium">
            <div className="text-center px-3">
              <p className="text-lg font-semibold">{posts.length}</p>
              <p>Posts</p>
            </div>
            <div
              className="text-center cursor-pointer"
              onClick={() => { setIsModalOpen({ ...isModalOpen, followers: true }) }}
            >
              <p className="text-lg font-semibold">{user.followers.length}</p>
              <p>Followers</p>
            </div>
            <div
              className="text-center cursor-pointer"
              onClick={() => { setIsModalOpen({ ...isModalOpen, following: true }) }}
            >
              <p className="text-lg font-semibold">{user.following.length}</p>
              <p>Following</p>
            </div>
          </div>
          {currentUser._id !== userId ? (
            <div className="grid grid-cols-10 gap-4 w-full font-medium">
              <button onClick={handleBlock} className={`col-span-3 p-2.5 transition-colors duration-200 text-white ${isBlocked ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500" } rounded-md`}>
                {isBlocked ? "Unblock": "Block"}
              </button>
              <button
                onClick={handleFollowStatus}
                className={`col-span-4 p-2.5 transition-colors duration-200 ${followStatus === "Follow" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-200 dark:bg-[#202020] hover:bg-gray-300 hover:dark:bg-[#252525]"} rounded-md`}
              >
                {followStatus}
              </button>
              <button
                onClick={openChat}
                className="col-span-3 p-2.5 transition-colors duration-200 text-white bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Message
              </button>
            </div>
          ) : (
            <div className="flex justify-center w-full font-medium">
              <button
                onClick={() => { setIsModalOpen({ ...isModalOpen, edit: true }) }}
                className="p-2 px-4 text-white transition-colors duration-200 bg-blue-600 hover:bg-blue-500 rounded-md"
              >
                <EditIcon className="mb-0.5 sm:mb-1" sx={{ fontSize: 20 }} />{" "}
                Edit Profile
              </button>
            </div>
          )}
        </div>

        <div className="pt-2">
          {user.isPrivate &&
          !currentUser.following.includes(user._id) &&
          currentUser._id !== user._id ? (
            <div className="flex flex-col gap-2 justify-center items-center dark:text-white">
              <LockIcon />
              <div className="text-center">
                <p className="text-xl font-medium">This Account is Private</p>
                <p className="opacity-70">Follow to view their posts.</p>
              </div>
            </div>
          ) : (
            posts.map((post) => {
              return <Post post={post} user={post.user} deletePost={removePost} key={post._id} />;
            })
          )}
        </div>

        {isModalOpen.followers && <FollowersModal 
          closeModal={() => { setIsModalOpen({ ...isModalOpen, followers: false }) }} 
          userId={userId} 
        />}
        {isModalOpen.following && <FollowingModal
          closeModal={() => { setIsModalOpen({ ...isModalOpen, following: false }) }}
          userId={userId}
        />}
        {isModalOpen.edit && <EditProfileModal
          closeModal={() => { setIsModalOpen({ ...isModalOpen, edit: false }) }}
        />}
      </div>
    </>
  );
};

export default UserProfile;