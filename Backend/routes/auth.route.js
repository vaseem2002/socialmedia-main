import express from "express";
import { registerUser, loginUser ,verifyUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
// Add this endpoint
router.get('/verify', verifyUser);

export default router;