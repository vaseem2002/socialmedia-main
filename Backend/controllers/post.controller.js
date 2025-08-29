import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// creates a new post
const createPost = async (req, res) => {
  try {
    const newPost = new Post(req.body);
    if(req.file) {
      const { mimetype, path } = req.file;
      if (!mimetype.startsWith("image/") && !mimetype.startsWith("video/")) {
        return res.status(400).json({ error: "Unsupported file type" });
      }
      const resourceType = mimetype.startsWith("image/") ? "image" : "video";
      const { secure_url, public_id } = await cloudinary.uploader.upload(path, { resource_type: resourceType });

      newPost.mediaType = resourceType;
      newPost.mediaUrl = secure_url;
      newPost.publicId = public_id;
    }
    const savedPost = await newPost.save();
    const user = await User.findById(newPost.userId);
    res.status(201).json({...savedPost._doc, user});
  } catch (error) {
    console.error("Error creating post: ", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

// deletes a post
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId !== req.body.userId) {
      return res.status(403).json({ error: "Unauthorized to delete post" });
    }
    await cloudinary.uploader.destroy(post.publicId);
    await post.deleteOne();
    res.status(200).json("Post deleted successfully");
  } catch (error) {
    console.error("Error deleting post: ", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// toggles like/dislike for a post
const handleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json("Post liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json("Post disliked");
    }
  } catch (error) {
    console.error("Error handling like: ", error);
    res.status(500).json({ error: "Failed to like/dislike post" });
  }
};

// toggles save/unsave for a post
const handleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.saves.includes(req.body.userId)) {
      await post.updateOne({ $push: { saves: req.body.userId } });
      res.status(200).json("Post saved");
    } else {
      await post.updateOne({ $pull: { saves: req.body.userId } });
      res.status(200).json("Post unsaved");
    }
  } catch (error) {
    console.error("Error handling save: ", error);
    res.status(500).json({ error: "Failed to save/unsave post" });
  }
};

// gets all posts for a user's timeline
const getTimelinePosts = async (req, res) => {
  try {
    const currUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currUser._id });
    const friendPosts = await Promise.all(
      currUser.following.map((friendId) => Post.find({ userId: friendId }))
    );
    const allPosts = userPosts.concat(...friendPosts);
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = await Promise.all(allPosts.map(async(post) => {
      const user = await User.findById(post.userId);
      return {...post._doc, user};
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting timeline posts: ", error);
    res.status(500).json({ error: "Failed to get timeline posts" });
  }
};

// get all posts created by a specific user
const getUserPosts = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: user._id });
    userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const result = await Promise.all(userPosts.map(async(post) => {
      const user = await User.findById(post.userId);
      return {...post._doc, user};
    }));
    
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting user posts: ", error);
    res.status(500).json({ error: "Failed to get user posts" });
  }
};

export { createPost, deletePost, handleLike, handleSave, getTimelinePosts, getUserPosts };
