import express from "express";
import { getComments, addComment, deleteComment } from "../controllers/comment.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/:postId", authMiddleware, getComments);
router.put("/", authMiddleware, addComment);
router.delete("/:id", authMiddleware, deleteComment);

export default router;