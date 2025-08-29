import express from "express";
import { createNotification, getUserNotifications, markAsRead, hasUnreadNotifications } from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createNotification);
router.get("/:userId", authMiddleware, getUserNotifications);
router.put("/mark-as-read", authMiddleware, markAsRead);
router.get("/:userId/has-unread", authMiddleware, hasUnreadNotifications);

export default router;
