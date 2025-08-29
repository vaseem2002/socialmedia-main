import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

// searches users by username
const searchUser = async (req, res) => {
  const { username } = req.query;
  try {
    const results = await User.find({
      $or: [{ username: { $regex: username, $options: "i" } }], // case-insensitive search
    }).limit(10).select("_id username profilePicture");

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching users: ", error);
    res.status(500).json({ error: "Failed to search users" });
  }
};

// updates a user's profile
const updateUser = async (req, res) => {
  const updatedUser = req.body;
  try {
    const oldUser = await User.findById(updatedUser._id);
    // Check if the username is being changed and is unique
    if (updatedUser.username !== oldUser.username) {
      const existingUser = await User.findOne({ username: updatedUser.username });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    const profilePicture = req.files.profilePicture?.[0];
    const coverPicture = req.files.coverPicture?.[0];

    if (profilePicture) {
      // Delete the old profile picture from Cloudinary if it exists
      if (oldUser.profilePicture) await cloudinary.uploader.destroy(oldUser.profilePicturePublicId);
      // Upload the new profile picture to Cloudinary
      const { secure_url, public_id } = await cloudinary.uploader.upload(profilePicture.path, {resource_type:"image"});
      updatedUser.profilePicture = secure_url;
      updatedUser.profilePicturePublicId = public_id;
    }
    if (coverPicture){
      // Delete the old cover picture from Cloudinary if it exists
      if (oldUser.coverPicture) await cloudinary.uploader.destroy(oldUser.coverPicturePublicId);
      // Upload the new cover picture to Cloudinary
      const { secure_url, public_id } = await cloudinary.uploader.upload(coverPicture.path, {resource_type:"image"});
      updatedUser.coverPicture = secure_url;
      updatedUser.coverPicturePublicId = public_id;
    } 

    const updatedDoc = await User.findByIdAndUpdate(req.params.id, { $set: updatedUser }, { new: true });
    res.status(200).json(updatedDoc);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update account" });
  }
};

// gets a user's profile
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const { password, ...userData } = user._doc;
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error getting user: ", error);
    res.status(500).json({ error: "Failed to get user" });
  }
};

// gets a user's followers
const getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const followers = await Promise.all(
      user.followers.map((followerId) => User.findById(followerId))
    );
    let followersList = [];
    followers.forEach((person) => {
      const { _id, username, profilePicture, isPrivate } = person;
      followersList.push({ _id, username, profilePicture, isPrivate });
    });
    res.status(200).json(followersList);
  } catch (error) {
    console.error("Error getting followers: ", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
};

// gets a user's following list
const getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const followings = await Promise.all(
      user.following.map((followingId) => User.findById(followingId))
    );
    let followingList = [];
    followings.forEach((person) => {
      const { _id, username, profilePicture, isPrivate, blockedUsers } = person;
      followingList.push({ _id, username, profilePicture, isPrivate, blockedUsers });
    });
    res.status(200).json(followingList);
  } catch (error) {
    console.error("Error getting following: ", error);
    res.status(500).json({ error: "Failed to get following" });
  }
};

// follows a user
const followUser = async (req, res) => {
  // check for self follow attempt
  if (req.body.userId === req.params.id) {
    return res.status(403).json("You can't follow yourself");
  }
  try {
    const user = await User.findById(req.params.id); // other user
    const currUser = await User.findById(req.body.userId); // current user
    if (user.isPrivate) {
      await user.updateOne({ $push: { requestedBy: currUser._id } });
      await currUser.updateOne({ $push: { requestedTo: user._id } });
      res.status(200).json("Follow request has been sent");
    } else if (!user.followers.includes(req.body.userId)) {
      await user.updateOne({ $push: { followers: currUser._id } });
      await currUser.updateOne({ $push: { following: user._id } });
      res.status(200).json("User has been followed");
    } else {
      res.status(400).json("You already follow this user");
    }
  } catch (error) {
    console.error("Error following user: ", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
};

// unfollows a user
const unfollowUser = async (req, res) => {
  if (req.body.userId === req.params.id) {
    return res.status(403).json("You can't unfollow yourself");
  }
  try {
    const user = await User.findById(req.params.id);
    const currUser = await User.findById(req.body.userId);
    if (user.followers.includes(currUser._id)) {
      await user.updateOne({ $pull: { followers: currUser._id } });
      await currUser.updateOne({ $pull: { following: user._id } });
      res.status(200).json("User has been unfollowed");
    } else {
      res.status(400).json("You don't follow this user");
    }
  } catch (error) {
    console.error("Error unfollowing user: ", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
};

// accepts a follow request
const acceptRequest = async (req, res) => {
  try {
    const requester = await User.findById(req.params.requesterId); 
    const user = await User.findById(req.body.userId);
    if (requester.requestedTo.includes(user._id)) {
      await requester.updateOne({
        $pull: { requestedTo: user._id },
        $push: { following: user._id },
      });
      await user.updateOne({
        $pull: { requestedBy: requester._id },
        $push: { followers: requester._id },
      });
      res.status(200).json("Follow request accepted");
    } else {
      res.status(400).json("No follow request found from this user");
    }
  } catch (error) {
    console.error("Error accepting request: ", error);
    res.status(500).json({ error: "Failed to accept request" });
  }
};

// rejects a follow request
const rejectRequest = async (req, res) => {
  try {
    const requester = await User.findById(req.params.requesterId);
    const user = await User.findById(req.body.userId);
    if (requester.requestedTo.includes(user._id)) {
      await requester.updateOne({ $pull: { requestedTo: user._id } });
      await user.updateOne({ $pull: { requestedBy: requester._id } });
      res.status(200).json("Follow request rejected");
    } else {
      res.status(400).json("No follow request found from this user");
    }
  } catch (error) {
    console.error("Error rejecting request: ", error);
    res.status(500).json({ error: "Failed to reject request" });
  }
};

// blocks or unblocks a user
const handleBlock = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user.blockedUsers.includes(req.params.id)) {
      await user.updateOne({ $push: { blockedUsers: req.params.id } });
      res.status(200).json("User blocked successfully");
    } else {
      await user.updateOne({ $pull: { blockedUsers: req.params.id } });
      res.status(200).json("User unblocked successfully");
    }
  } catch (error) {
    console.error("Error handling block/unblock", error);
    res.status(500).json({ error: "Failed to block/unblock user" });
  }
};

// gets user suggestions based on following list (sorts by mutual friends)
const getSuggestions = async (req, res) => {
  const { userId } = req.params;
  try {
    const currentUser = await User.findById(userId).select("following blockedUsers");
    const followingList = currentUser.following;
    const blockedUsers = currentUser.blockedUsers;
    // Fetch users not already followed (exclude itself and blockedUsers)
    const allUsers = await User.find({
      _id: { $ne: userId, $nin: [...followingList, ...blockedUsers] },
    }).limit(5).select("_id username profilePicture following isPrivate");
    
    let suggestions = allUsers.map((user) => {
      const mutualFriends = user.following.filter((friend) => followingList.includes(friend)).length;
      const { _id, username, profilePicture, isPrivate } = user;
      return { _id, username, profilePicture, isPrivate, mutualFriends };
    });
    // sort suggestions by the number of mutual friends (descending order)
    suggestions.sort((a, b) => b.mutualFriends - a.mutualFriends);
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error getting suggestions: ", error);
    res.status(500).json({ error: "Failed to get suggestions" });
  }
};

export { searchUser, updateUser, getUser, getFollowers, getFollowing,
followUser, unfollowUser, acceptRequest, rejectRequest, handleBlock, getSuggestions };