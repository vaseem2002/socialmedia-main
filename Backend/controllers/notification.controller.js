import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// creates a new notification
const createNotification = async (req, res) => {
  try {
    const newNotification = new Notification(req.body);
    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error("Error creating notification: ", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// fetches a user's notification with sender details
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });
    
    const notificationsWithSender = await Promise.all(
      notifications.map(async (notification) => {
        const sender = await User.findById(notification.senderId).select("username profilePicture");
        return { ...notification._doc, sender };
      })
    );

    res.status(200).json(notificationsWithSender);
  } catch (error) {
    console.error("Error fetching notifications: ", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// marks notifications as read
const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    await Notification.updateMany({ _id: { $in: notificationIds } }, { $set: { isRead: true } });
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read: ", error);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
};

// checks if a user has unread notifications
const hasUnreadNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    const hasUnreadNotifications = await Notification.exists({ userId, isRead: false });
    res.status(200).json({ hasUnreadNotifications: Boolean(hasUnreadNotifications) });
  } catch (error) {
    console.error("Error checking unread notifications:", error);
    res.status(500).json({ error: "Failed to check unread notifications" });
  }
};

export { createNotification, getUserNotifications, markAsRead, hasUnreadNotifications };
