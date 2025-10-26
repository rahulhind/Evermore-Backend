import Notification from "../models/Notifications.js";
import User from "../models/User.js";
import { createNotificationData } from "../utils/notificationFactory.js";

/* CREATE NOTIFICATION */
export const createNotification = async (type, { sender, recipient, metadata = {} }) => {
  try {
    console.log("=".repeat(60));
    console.log("📬 CREATE NOTIFICATION CALLED");
    console.log("  Type:", type);
    console.log("  Sender (input):", sender);
    console.log("  Sender type:", typeof sender);
    console.log("  Recipient:", recipient);

    // Validate inputs
    if (!sender) {
      console.error("❌ ERROR: Sender is undefined");
      return null;
    }

    if (!recipient) {
      console.error("❌ ERROR: Recipient is undefined");
      return null;
    }

    // Don't create notification if user is notifying themselves
    const senderId = typeof sender === 'string' ? sender : sender._id?.toString();
    const recipientId = typeof recipient === 'string' ? recipient : recipient._id?.toString();
    
    if (senderId === recipientId) {
      console.log("⚠️ SKIPPING: Self-notification");
      console.log("=".repeat(60));
      return null;
    }

    // ✅ CRITICAL: Always fetch the full user object
    let senderData;
    if (typeof sender === "string") {
      console.log("🔍 Fetching sender user from database (ID):", sender);
      senderData = await User.findById(sender);
      
      if (!senderData) {
        console.error("❌ ERROR: Sender user not found:", sender);
        console.log("=".repeat(60));
        return null;
      }
      
      console.log("✅ Sender fetched:", senderData.firstName, senderData.lastName);
    } else if (sender._id) {
      console.log("✅ Sender is already a user object");
      senderData = sender;
    } else {
      console.error("❌ ERROR: Invalid sender format");
      console.log("=".repeat(60));
      return null;
    }

    // ✅ Validate sender has required fields
    if (!senderData.firstName || !senderData.lastName) {
      console.error("❌ ERROR: Sender missing name fields");
      console.error("  Sender data:", JSON.stringify(senderData, null, 2));
      console.log("=".repeat(60));
      return null;
    }

    console.log("✅ Calling notification factory...");

    // ✅ Pass the COMPLETE user object to factory
    const notificationData = createNotificationData(type, {
      sender: senderData, // Full user object
      recipient: recipientId,
      metadata,
    });

    console.log("✅ Notification data created");

    // Check for duplicate
    const isDuplicate = await Notification.findOne({
      recipient: recipientId,
      sender: senderData._id,
      type,
      relatedPost: notificationData.relatedPost,
      read: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    if (isDuplicate) {
      console.log("⚠️ Duplicate found, updating");
      isDuplicate.createdAt = new Date();
      isDuplicate.message = notificationData.message;
      await isDuplicate.save();
      console.log("=".repeat(60));
      return isDuplicate;
    }

    // Save new notification
    const notification = new Notification(notificationData);
    await notification.save();

    console.log(`✅ NOTIFICATION CREATED: ${notification._id}`);
    console.log("=".repeat(60));
    
    return notification;
  } catch (error) {
    console.error("=".repeat(60));
    console.error("❌ ERROR in createNotification:");
    console.error("  Message:", error.message);
    console.error("  Stack:", error.stack);
    console.error("=".repeat(60));
    return null;
  }
};




/* GET USER NOTIFICATIONS (Enhanced with filtering) */
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      limit = 20,
      skip = 0,
      category,
      read,
      priority,
    } = req.query;

    // Build filter
    const filter = {
      recipient: userId,
      dismissed: false,
    };

    if (category) filter.category = category;
    if (read !== undefined) filter.read = read === "true";
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .populate("sender", "firstName lastName picturePath")
      .populate("relatedUser", "firstName lastName picturePath")
      .sort({ priority: -1, createdAt: -1 }) // Sort by priority first
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
      dismissed: false,
    });

    // Count by category
    const categoryCounts = await Notification.aggregate([
      { $match: { recipient: userId, read: false, dismissed: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      notifications,
      unreadCount,
      categoryCounts,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: error.message });
  }
};

/* MARK AS CLICKED */
export const markAsClicked = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { clicked: true, read: true },
      { new: true }
    );

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DISMISS NOTIFICATION */
export const dismissNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { dismissed: true, read: true },
      { new: true }
    );

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* BULK CREATE NOTIFICATIONS (For system/promo notifications) */
export const bulkCreateNotifications = async (req, res) => {
  try {
    const { type, recipients, metadata } = req.body;

    // Verify admin/system permission here
    // if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized" });

    const notifications = await Promise.all(
      recipients.map((recipientId) =>
        createNotification(type, {
          sender: null,
          recipient: recipientId,
          metadata,
        })
      )
    );

    res.status(200).json({
      message: `Created ${notifications.length} notifications`,
      notifications,
    });
  } catch (error) {
    console.error("Error bulk creating notifications:", error);
    res.status(500).json({ message: error.message });
  }
};


/* MARK NOTIFICATION AS READ */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    console.log("📖 Marking notification as read:", notificationId);

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ message: error.message });
  }
};

/* MARK ALL NOTIFICATIONS AS READ */
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📖 Marking all notifications as read for user:", userId);

    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Error marking all as read:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE NOTIFICATION */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    console.log("🗑️ Deleting notification:", notificationId);

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET UNREAD COUNT */
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("📊 Fetching unread count for user:", userId);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });

    console.log(`✅ Unread count: ${unreadCount}`);

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    res.status(500).json({ message: error.message });
  }
};