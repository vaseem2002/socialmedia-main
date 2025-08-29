import express from "express";
import {
  createGroup,
  getGroup,  // Make sure this is imported
  getGroups,
  joinGroup,
  handleJoinRequest,
  removeMember,
  sendGroupMessage,
  getGroupMessages, // Add if needed
  markAsRead,
  updateGroup,
  getLastGroupMessage,
  getUnreadGroupMessagesCount,
  getGroupMembers,
  updateMemberRole,
  deleteGroup,
  updateMessage,
  deleteMessage
    // getGroupMemberRole  // Add if needed
} from "../controllers/group.controller.js";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// Group management routes
router.post("/", 
  authMiddleware, 
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 }
  ]), 
  createGroup
);

router.get("/", authMiddleware, getGroups);
router.get("/:groupId", authMiddleware, getGroup); // Add this crucial route

// Membership routes
router.post("/:groupId/join", authMiddleware, joinGroup);
router.put("/:groupId/requests/:userId", authMiddleware, handleJoinRequest);
router.delete("/:groupId/members/:userId", authMiddleware, removeMember);
router.get("/:groupId/members", authMiddleware, getGroupMembers); // Add if needed
// router.get('/:groupId/members', authMiddleware, getGroupMemberRole);

// Message routes
router.get("/:groupId/messages", authMiddleware, getGroupMessages);
router.get("/:groupId/messages/last", authMiddleware, getLastGroupMessage);
router.post("/:groupId/messages", 
  authMiddleware, 
  upload.single("media"), 
  sendGroupMessage
);

// Utility routes
router.get("/:groupId/unread", authMiddleware, getUnreadGroupMessagesCount);
router.put("/:groupId/messages/read", authMiddleware, markAsRead);
router.put('/:groupId/members/:userId/role', authMiddleware, updateMemberRole);

// Update routes
router.patch('/:groupId', 
  authMiddleware,
  upload.fields([{ name: 'avatar', maxCount: 1 }]),
  updateGroup
);

router.delete('/:groupId', authMiddleware, deleteGroup);
router.put('/messages/:messageId', authMiddleware, updateMessage);
router.delete('/messages/:messageId', authMiddleware, deleteMessage);

export default router;