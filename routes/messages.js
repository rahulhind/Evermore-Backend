import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import {
  getUserConversations,
  getOrCreateConversation,
  sendMessage,
  sendImageMessage,
  markMessagesAsRead,
  updateTypingStatus,
  updateLastSeen,
  deleteMessage,
  editMessage,
  getUnreadCount,
  deleteConversation,
} from "../controllers/messages.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary storage for chat images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat_images",
    format: async (req, file) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      const allowedFormats = ["jpeg", "jpg", "png", "gif"];
      return allowedFormats.includes(extension) ? extension : "jpeg";
    },
    public_id: async (req, file) => {
      const uniqueId = "chat_" + Date.now();
      return uniqueId;
    },
  },
});

const upload = multer({ storage: storage });

/* GET CONVERSATIONS */
router.get("/:userId/conversations", verifyToken, getUserConversations);
router.get("/:userId/unread-count", verifyToken, getUnreadCount);
router.get(
  "/:userId/conversation/:otherUserId",
  verifyToken,
  getOrCreateConversation
);

/* SEND MESSAGES */
router.post("/:conversationId/send", verifyToken, sendMessage);
router.post(
  "/:conversationId/send-image",
  verifyToken,
  upload.single("image"),
  sendImageMessage
);

/* MESSAGE ACTIONS */
router.patch("/:conversationId/read/:userId", verifyToken, markMessagesAsRead);
router.patch("/:conversationId/typing", verifyToken, updateTypingStatus);
router.patch("/:conversationId/last-seen/:userId", verifyToken, updateLastSeen);
router.patch(
  "/:conversationId/message/:messageId/edit",
  verifyToken,
  editMessage
);
router.delete(
  "/:conversationId/message/:messageId",
  verifyToken,
  deleteMessage
);

/* DELETE CONVERSATION */
router.delete("/:conversationId/:userId", verifyToken, deleteConversation);

export default router;
