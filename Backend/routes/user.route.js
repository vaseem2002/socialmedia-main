import express from "express";
import { searchUser, updateUser, getUser, getFollowers, getFollowing, followUser,
unfollowUser, acceptRequest, rejectRequest, handleBlock, getSuggestions } 
from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/search", searchUser);
router.get("/:id", getUser);
router.put("/:id", authMiddleware, upload.fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "coverPicture", maxCount: 1 }
]), updateUser);
router.get("/followers/:id", getFollowers);
router.get("/following/:id", getFollowing);
router.put("/:id/follow", authMiddleware, followUser);
router.put("/:id/unfollow", authMiddleware, unfollowUser);
router.put("/:requesterId/acceptRequest", authMiddleware, acceptRequest);
router.put("/:requesterId/rejectRequest", authMiddleware, rejectRequest);
router.put("/:id/block", authMiddleware, handleBlock);
router.get("/suggestions/:userId", authMiddleware, getSuggestions);

export default router;