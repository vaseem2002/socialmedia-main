import express from "express";
import { createPost, deletePost, handleLike, handleSave, getTimelinePosts, getUserPosts } from "../controllers/post.controller.js";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("file"), createPost);
router.delete("/:id", authMiddleware, deletePost);
router.put("/:id/like", authMiddleware, handleLike);
router.put("/:id/save", authMiddleware, handleSave);
router.get("/timeline/:userId", authMiddleware, getTimelinePosts);
router.get("/userPosts/:userId", authMiddleware, getUserPosts);

export default router;
