import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const newUser = new User({
      fullname: req.body.fullname,
      username: req.body.username,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.status(201).json(user);
  } catch (error) {
    console.error("Registration error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    const decoded = jwt.decode(token);
  console.log("Decoded Token: ", decoded);
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Login error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyUser = async (req, res) => {
  try {
    let token;

    // 1. Check Authorization header (case-insensitive)
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1].trim();
    }
    // 2. Check cookies (if using cookies)
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // 3. Check query parameter (for debugging)
    else if (req.query.token) {
      token = req.query.token;
    }

    // If no token found, return error
    if (!token) {
      console.log('No token found in any location');
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If token is valid, return the userId and valid status
    res.status(200).json({ 
      valid: true,
      userId: decoded._id 
    });
  } catch (error) {
    console.error('Verification error:', error.message);

    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // General error
    res.status(500).json({ message: 'Internal server error' });
  }
}


export { registerUser, loginUser, verifyUser };
