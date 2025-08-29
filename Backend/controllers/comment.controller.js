import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// fetches comments for a specific post
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId });
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
      const user = await User.findById(comment.userId).select("username profilePicture");
      return {...comment._doc, user};
    }));
    res.status(200).json(commentsWithUsers);
  } catch (error) {
    console.error("Error fetching comments: ", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// adds a new comment to a post
const addComment = async (req, res) => {
  const newComment = new Comment(req.body);
  try {
    // update post's comment count
    await Post.findByIdAndUpdate(newComment.postId, { $inc: { commentCount: 1 } });
    // save the new comment
    const savedComment = await newComment.save();
    const user = await User.findById(newComment.userId).select("username profilePicture");

    res.status(201).json({...savedComment._doc, user});
  } catch (error) {
    console.error("Error adding comment: ", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// deletes a comment
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    const post = await Post.findById(comment.postId);

    // check authorization (commenter or post owner)
    if (comment.userId === req.body.userId || post.userId === req.body.userId) {
      await post.updateOne({ $inc: { commentCount: -1 } });
      await comment.deleteOne();
      res.status(200).json("Comment deleted successfully");
    } else {
      res.status(403).json("Unauthorized comment deletion");
    }
  } catch (error) {
    console.error("Error deleting comment: ", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

export { getComments, addComment, deleteComment };
