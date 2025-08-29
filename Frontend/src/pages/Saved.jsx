import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/userContext";
import { ThemeContext } from "../context/themeContext";
import Post from "../components/Post";
import axios from "axios";
import { toast } from "react-toastify";
import PostSkeleton from "../components/skeletons/PostSkeleton";
import { AuthContext } from "../context/authContext";

const Saved = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/timeline/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const posts = response.data;
        setSavedPosts(posts.filter((post) => post.saves.includes(user._id)));
      } catch (error) {
        console.error("Error fetching saved posts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedPosts();
  }, [user._id]);

  const removePost = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`,
        { data: { userId: user._id } , 
          headers: {
            Authorization: `Bearer ${token}`,
          },
         }
      );
      setSavedPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      toast.info("Post deleted successfully!", { theme });
    } catch (error) {
      console.error("Error deleting post:", error.message);
      toast.error("Failed to delete post. Please try again.", { theme });
    }
  };

  return (
    <>
      <div className="bg-white text-xl sm:text-2xl font-bold text-center p-3 mb-5 shadow rounded-lg dark:bg-[#101010] dark:text-white">
        Saved Posts
      </div>
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))
        : savedPosts.length > 0 ? savedPosts.map((post) => (
            <Post post={post} user={post.user} deletePost={removePost} key={post._id} />
          ))
        : <div className="h-[50vh] px-5 flex items-center justify-center dark:text-white">
            <div className="text-center">
              <p className="text-2xl font-medium mb-2">You haven't saved any posts yet.</p>
              <p className="text-lg opacity-80">Start exploring and save your favorites for later!</p>
            </div>
          </div>}
    </>
  );
};

export default Saved;
