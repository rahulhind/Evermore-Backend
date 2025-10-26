import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  markAsClicked,
  dismissNotification,
  deleteNotification,
  getUnreadCount,
  bulkCreateNotifications,
} from "../controllers/notifications.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ */
router.get("/:userId", verifyToken, getUserNotifications);
router.get("/:userId/unread-count", verifyToken, getUnreadCount);

/* UPDATE */
router.patch("/:notificationId/read", verifyToken, markAsRead);
router.patch("/:notificationId/clicked", verifyToken, markAsClicked);
router.patch("/:notificationId/dismiss", verifyToken, dismissNotification);
router.patch("/:userId/read-all", verifyToken, markAllAsRead);

/* DELETE */
router.delete("/:notificationId", verifyToken, deleteNotification);

/* BULK OPERATIONS (Admin/System) */
router.post("/bulk", verifyToken, bulkCreateNotifications);

export default router;
