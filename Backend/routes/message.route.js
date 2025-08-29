import express from "express";
import { getMessages, sendMessage, markAsRead } from "../controllers/message.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/:chatId", authMiddleware, getMessages);
router.post("/", authMiddleware, sendMessage);
router.post("/mark-as-read", authMiddleware, markAsRead);

export default router;
