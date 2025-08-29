import express from "express";
import { createChat, getChats, hasUnreadChats } from "../controllers/chat.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createChat);
router.get("/:userId", authMiddleware, getChats);
router.get("/:userId/has-unread", authMiddleware, hasUnreadChats);

export default router;
