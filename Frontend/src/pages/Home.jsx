import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/userContext";
import { ThemeContext } from "../context/themeContext";
import CreatePost from "../components/CreatePost";
import Post from "../components/Post";
import axios from "axios";
import { toast } from "react-toastify";
import PostSkeleton from "../components/skeletons/PostSkeleton";
import { AuthContext } from "../context/authContext";

const Home = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useContext(AuthContext);
  const { user } = useContext(UserContext);
  const { theme } = useContext(ThemeContext);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/posts/timeline/${user._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts:", error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [user.id]);

  const removePost = async (postId) => {
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}`,
        { data: { userId: user._id } , 
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      toast.info("Post deleted successfully!", { theme });
    } catch (error) {
      console.error("Error deleting post:", error.message);
      toast.error("Failed to delete post. Please try again.", { theme });
    }
  };

  return (
    <>
      <CreatePost setPosts={setPosts} />
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            <PostSkeleton key={index} />
          ))
        : posts.length > 0 ? posts.map((post) => (
            <Post post={post} user={post.user} deletePost={removePost} key={post._id} />
          ))
        : <div className="h-[50vh] px-5 flex items-center justify-center dark:text-white">
            <div className="text-center">
              <p className="text-2xl font-medium mb-2">Welcome to your timeline!</p>
              <p className="text-lg opacity-80">Create your first post or explore profiles to start building your feed.</p>
            </div>
          </div>}
    </>
  );
};

export default Home;
