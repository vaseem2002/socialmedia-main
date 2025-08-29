import mongoose from 'mongoose';
import Group from "../models/group.model.js";
import GroupMember from "../models/groupMember.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import {connectCloudinary,uploadToCloudinary} from "../config/cloudinary.js";
// Create a new group
export const createGroup = async (req, res) => {
  try {
    const { name, description, privacy } = req.body;
    const creator = req.user._id;

    // Upload avatar
    let avatarUrl = "";
    if (req.files?.avatar) {
      avatarUrl = await uploadToCloudinary(req.files.avatar[0].path, "group-avatars");
    }

    // Upload cover photo
    let coverPhotoUrl = "";
    if (req.files?.coverPhoto) {
      coverPhotoUrl = await uploadToCloudinary(req.files.coverPhoto[0].path, "group-covers");
    }

    const newGroup = new Group({
      name,
      description,
      creator,
      privacy,
      avatar: avatarUrl,
      coverPhoto: coverPhotoUrl
    });

    await newGroup.save();

    // Add creator as admin
    await GroupMember.create({
      group: newGroup._id,
      user: creator,
      role: "admin"
    });

    res.status(201).json(newGroup);
  } catch (err) {
    console.error("Group creation error:", err);
    res.status(500).json({ 
      message: "Failed to create group",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user._id;
    
    // Get groups where user is a member
    const userGroups = await GroupMember.find({ 
      user: userId, 
      status: "joined" 
    })
      .select("group")
      .populate({
        path: "group",
        select: "name description privacy avatar membersCount" // Only populate needed fields
      })
      .lean();

    // Safely extract group objects
    const userGroupObjects = (userGroups || []).map(member => member.group).filter(Boolean);

    // Get public groups user isn't already in
    const publicGroups = await Group.find({ 
      privacy: "public",
      _id: { $nin: userGroupObjects.map(g => g?._id).filter(Boolean) } // Safe mapping
    })
      .select("name description privacy avatar membersCount")
      .lean();

    const allGroups = [...userGroupObjects, ...(publicGroups || [])];
    
    const groups = await Group.find({
      $or: [
        { privacy: "public" },
        { creator: userId, privacy: "private" }
      ]
    }).populate('creator', 'username');
    return res.status(200).json(allGroups);

  } catch (err) {
    console.error("Error fetching groups:", err);
    return res.status(500).json({ 
      message: "Failed to fetch groups",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Join or request to join a group
export const joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { privacy } = req.body; 
    const userId = req.user._id;
    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if user is already a member or has pending request
    const existingMember = await GroupMember.findOne({
      group: groupId,
      user: userId
    });

    if (existingMember) {
      return res.status(400).json({ message: "Already in group or request pending" });
    }

    if (group.privacy === "public") {
      // Directly add to group
      await GroupMember.create({
        group: groupId,
        user: userId,
        role: "member",
        status: "joined"
      });

      return res.status(200).json({ message: "Joined group successfully" });
    } else if (group.privacy === "private") {
      // Create pending request
      await GroupMember.create({
        group: groupId,
        user: userId,
        role: "member",
        status: "pending"
      });

      // Notify group admins
      const admins = await GroupMember.find({
        group: groupId,
        role: "admin"
      });

      for (const admin of admins) {
        await Notification.create({
          recipient: admin.user,
          sender: userId,
          type: "group-join-request",
          content: `wants to join your group ${group.name}`,
          referenceId: groupId
        });
      }

      return res.status(200).json({ message: "Join request sent to admins" });
    } else {
      return res.status(400).json({ message: "This group is invite-only" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve/reject join request (admin only)
export const handleJoinRequest = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { action } = req.body; // "approve" or "reject"
    const adminId = req.user._id;

    // Verify admin status
    const isAdmin = await GroupMember.exists({
      group: groupId,
      user: adminId,
      role: "admin"
    });

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can handle join requests" });
    }

    const member = await GroupMember.findOne({
      group: groupId,
      user: userId,
      status: "pending"
    });

    if (!member) {
      return res.status(404).json({ message: "No pending request found" });
    }

    if (action === "approve") {
      member.status = "joined";
      await member.save();

      // Notify user
      await Notification.create({
        recipient: userId,
        sender: adminId,
        type: "group-request-approved",
        content: `approved your request to join ${group.name}`,
        referenceId: groupId
      });

      return res.status(200).json({ message: "Request approved" });
    } else if (action === "reject") {
      member.status = "rejected";
      await member.save();

      // Notify user
      await Notification.create({
        recipient: userId,
        sender: adminId,
        type: "group-request-rejected",
        content: `rejected your request to join ${group.name}`,
        referenceId: groupId
      });

      return res.status(200).json({ message: "Request rejected" });
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requesterId = req.user._id;

    // Validate ObjectIDs
    if (!mongoose.Types.ObjectId.isValid(groupId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // CASE 1: User leaving voluntarily
    if (userObjId.equals(requesterId)) {
      const membership = await GroupMember.findOneAndDelete({
        group: groupObjId,
        user: userObjId
      });

      if (!membership) {
        return res.status(404).json({ message: "You're not in this group" });
      }

      // Notify admins (optional)
      const admins = await GroupMember.find({ 
        group: groupObjId, 
        role: "admin" 
      });

      await Promise.all(admins.map(admin => 
        Notification.create({
          recipient: admin.user,
          sender: requesterId, // The user who left
          type: "group-left",
          content: `${req.user.username} left the group`,
          referenceId: groupId
        })
      ));

      return res.status(200).json({ 
        message: "You have left the group successfully" 
      });
    }

    // CASE 2: Admin removing another member
    const isAdmin = await GroupMember.exists({
      group: groupObjId,
      user: requesterId,
      role: "admin"
    });

    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Only admins can remove other members" 
      });
    }

    const removedMember = await GroupMember.findOneAndDelete({
      group: groupObjId,
      user: userObjId
    });

    if (!removedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Notify removed user (with validation)
    try {
      const group = await Group.findById(groupId).select('name');
      if (group) {
        await Notification.create({
          recipient: userObjId, // Who was removed
          sender: requesterId,  // The admin who removed them
          type: "group-removed",
          content: `You were removed from "${group.name}"`,
          referenceId: groupId,
          read: false
        });
      }
    } catch (notifError) {
      console.error("Notification failed:", notifError);
      // Continue even if notification fails
    }

    res.status(200).json({
      message: "Member removed successfully",
      removedUserId: userId
    });

  } catch (err) {
    console.error("Removal error:", err);
    res.status(500).json({ 
      message: "Failed to process request",
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message
      })
    });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    // Validate input
    if (!content?.trim() && !req.file) {
      return res.status(400).json({ 
        message: "Message content or media is required",
        code: "EMPTY_MESSAGE"
      });
    }

    // Handle media upload
    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      mediaUrl = await uploadToCloudinary(req.file.path, "group-messages");
      mediaType = req.file.mimetype.split('/')[0];
      
      // Validate mediaType matches your enum
      if (!['image', 'video', 'audio', 'file'].includes(mediaType)) {
        return res.status(400).json({
          message: "Unsupported media type",
          code: "UNSUPPORTED_MEDIA"
        });
      }
    }

    // Create message
    const messageData = {
      group: groupId,
      sender: senderId,
      content: content?.trim(),
      readBy: [senderId]
    };

    // Only add media fields if they exist
    if (mediaUrl) {
      messageData.media = mediaUrl;
      messageData.mediaType = mediaType;
    }

    const newMessage = await GroupMessage.create(messageData);

    // ... rest of your notification and response logic ...
    res.status(201).json(await GroupMessage.findById(newMessage._id)
      .populate("sender", "username profilePicture"));

  } catch (err) {
    console.error("Message send error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      validationErrors: err.errors
    });

    res.status(500).json({ 
      message: "Failed to send message",
      code: "MESSAGE_CREATION_FAILED",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Verify user is a member of the group
    const isMember = await GroupMember.exists({
      group: groupId,
      user: userId,
      status: "joined"
    });

    if (!isMember) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username profilePicture")
      .exec();

    res.status(200).json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Add user to readBy array for all unread messages
    await GroupMessage.updateMany(
      {
        group: groupId,
        readBy: { $ne: userId }
      },
      {
        $push: { readBy: userId }
      }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Update group information
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, privacy } = req.body;

    // Verify admin status
    const isAdmin = await GroupMember.exists({
      group: groupId,
      user: req.user._id,
      role: "admin"
    });

    if (!isAdmin) {
      return res.status(403).json({ message: "Only admins can update group" });
    }

    const updates = { name, description, privacy };

    // Handle avatar upload
    if (req.files?.avatar) {
      const avatarUrl = await uploadToCloudinary(req.files.avatar[0].path, "group-avatars");
      updates.avatar = avatarUrl;
    }

    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      updates,
      { new: true }
    ).populate('creator', 'username profilePicture');

    res.status(200).json(updatedGroup);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get last message in a group
export const getLastGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Verify user is a member
    const isMember = await GroupMember.exists({
      group: groupId,
      user: userId,
      status: "joined"
    });

    if (!isMember) {
      return res.status(403).json({ message: "Not a group member" });
    }

    const message = await GroupMessage.findOne({ group: groupId })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePicture")
      .exec();

    res.status(200).json(message || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get unread message count for a group
export const getUnreadGroupMessagesCount = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const count = await GroupMessage.countDocuments({
      group: groupId,
      readBy: { $ne: userId }
    });

    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// group.controller.js
export const getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('creator', 'username profilePicture');
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Get member count
    const memberCount = await GroupMember.countDocuments({ 
      group: req.params.groupId,
      status: 'joined' 
    });
    
    res.status(200).json({ ...group.toObject(), membersCount: memberCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const members = await GroupMember.find({ group: req.params.groupId })
      .populate('user', 'username profilePicture')
      .lean();
    
    res.status(200).json(members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const adminId = req.user._id;

    // 1. INPUT VALIDATION ============================================
    // Verify ObjectIDs first
    if (!mongoose.Types.ObjectId.isValid(groupId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        message: "Invalid ID format",
        details: {
          groupIdValid: mongoose.Types.ObjectId.isValid(groupId),
          userIdValid: mongoose.Types.ObjectId.isValid(userId)
        }
      });
    }

    // Convert to ObjectId immediately
    const groupObjId = new mongoose.Types.ObjectId(groupId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // 2. ROLE VALIDATION =============================================
    // Trim and lowercase the role value to prevent case/whitespace issues
    const cleanRole = String(role).trim().toLowerCase();
    const allowedRoles = ["admin", "member"];

    if (!allowedRoles.includes(cleanRole)) {
      return res.status(400).json({ 
        message: "Invalid role value",
        received: role,
        cleanVersion: cleanRole,
        allowedValues: allowedRoles
      });
    }

    // 3. PERMISSION CHECK ============================================
    // Check if requester is admin of this group
    const isAdmin = await GroupMember.findOne({
      group: groupObjId,
      user: adminId,
      role: "admin"
    }).lean();

    if (!isAdmin) {
      return res.status(403).json({ 
        message: "Only admins can change roles",
        debug: {
          adminId,
          groupId: groupObjId
        }
      });
    }

    // 4. TARGET MEMBER VERIFICATION ==================================
    const targetMember = await GroupMember.findOne({
      group: groupObjId,
      user: userObjId
    }).lean();

    if (!targetMember) {
      const existingMembers = await GroupMember.find({ group: groupObjId });
      return res.status(404).json({
        message: "Member not found in group",
        existingMembers: existingMembers.map(m => m.user.toString())
      });
    }

    // 5. PREVENT SELF-DEMOTION =======================================
    if (userObjId.equals(adminId) && cleanRole === "member") {
      return res.status(400).json({
        message: "Admins cannot demote themselves",
        solution: "Have another admin perform this action"
      });
    }

    // 6. PERFORM THE UPDATE ==========================================
    const updateResult = await GroupMember.updateOne(
      { _id: targetMember._id },
      { $set: { role: cleanRole } }
    );

    // 7. VERIFY THE UPDATE ===========================================
    const updatedMember = await GroupMember.findById(targetMember._id)
      .populate('user', 'username');

    if (!updatedMember || updatedMember.role !== cleanRole) {
      console.error('Update verification failed:', {
        updateResult,
        finalState: updatedMember
      });
      throw new Error("Role update failed verification");
    }

    // 8. SUCCESS RESPONSE ============================================
    res.status(200).json({
      message: "Role updated successfully",
      member: updatedMember,
      debug: {
        initialRole: targetMember.role,
        newRole: cleanRole,
        modifiedCount: updateResult.modifiedCount
      }
    });

  } catch (err) {
    console.error('Role update error:', {
      error: err.message,
      stack: err.stack,
      request: {
        params: req.params,
        body: req.body,
        user: req.user
      }
    });

    res.status(500).json({ 
      message: "Failed to update role",
      ...(process.env.NODE_ENV === 'development' && {
        error: err.message,
        stack: err.stack
      })
    });
  }
};

// In your group controller
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Check if user is group admin
    const group = await Group.findOne({
      _id: groupId,
      $or: [
        { creator: userId },
        { admins: userId }
      ]
    });

    if (!group) {
      return res.status(403).json({ 
        message: "Only group admins can delete the group" 
      });
    }

    await Group.findByIdAndDelete(groupId);
    res.status(200).json({ message: "Group deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update message controller
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Find the message using GroupMessage (not Message)
    const message = await GroupMessage.findOneAndUpdate(
      {
        _id: messageId,
        sender: userId,
        isEditable: true
      },
      { content },
      { new: true }
    );

    if (!message) {
      return res.status(403).json({ 
        message: "Cannot edit message (either not yours or time expired)" 
      });
    }

    res.status(200).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// For message deletion
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Use GroupMessage instead of Message
    const message = await GroupMessage.findOne({
      _id: messageId,
      $or: [
        { sender: userId, isEditable: true }, // Original sender within 1 hour
        { 
          group: await Group.findOne({ 
            $or: [
              { creator: userId },
              { admins: userId }
            ]
          })
        } // Group admin anytime
      ]
    });

    if (!message) {
      return res.status(403).json({ 
        message: "Cannot delete message (not authorized or time expired)" 
      });
    }

    await GroupMessage.deleteOne({ _id: messageId });
    res.status(200).json({ message: "Message deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: err.message });
  }
};