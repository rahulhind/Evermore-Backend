import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

/* GET USER CONVERSATIONS */
export const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("💬 Fetching conversations for user:", userId);

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName picturePath")
      .sort({ lastMessageAt: -1 })
      .limit(50);

    // Calculate unread counts and format data
    const conversationsWithDetails = conversations.map((conv) => {
      const unreadCount = conv.messages.filter(
        (msg) => !msg.read && msg.sender.toString() !== userId && !msg.deleted
      ).length;

      // Get the other participant
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId
      );

      // Get last seen of other participant
      const lastSeen = conv.lastSeen.get(otherParticipant._id.toString());

      // Check if other user is typing
      const isTyping = conv.typing.get(otherParticipant._id.toString());

      return {
        ...conv.toObject(),
        unreadCount,
        otherParticipant,
        lastSeen,
        isTyping: !!isTyping,
      };
    });

    console.log(`✅ Found ${conversations.length} conversations`);
    res.status(200).json(conversationsWithDetails);
  } catch (error) {
    console.error("❌ Error fetching conversations:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET OR CREATE CONVERSATION */
export const getOrCreateConversation = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    console.log("🔍 Getting conversation between:", userId, "and", otherUserId);

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, otherUserId] },
    }).populate("participants", "firstName lastName picturePath");

    if (!conversation) {
      console.log("Creating new conversation...");

      const user1 = await User.findById(userId);
      const user2 = await User.findById(otherUserId);

      if (!user1 || !user2) {
        return res.status(404).json({ message: "User not found" });
      }

      conversation = new Conversation({
        participants: [userId, otherUserId],
        messages: [],
        lastMessage: "",
        lastMessageAt: new Date(),
        lastSeen: new Map(),
        typing: new Map(),
        muted: new Map(),
      });

      await conversation.save();

      conversation = await Conversation.findById(conversation._id).populate(
        "participants",
        "firstName lastName picturePath"
      );

      console.log("✅ New conversation created");
    } else {
      console.log("✅ Existing conversation found");
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error("❌ Error getting/creating conversation:", error);
    res.status(500).json({ message: error.message });
  }
};

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, content, type = "text", replyTo } = req.body;

    console.log("📨 Sending message:", { conversationId, type });

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const newMessage = {
      sender: senderId,
      content: content?.trim() || "",
      type,
      read: false,
      delivered: true,
      deliveredAt: new Date(),
      replyTo: replyTo || null,
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage =
      type === "text"
        ? content?.trim().substring(0, 100)
        : type === "image"
        ? "📷 Image"
        : "Sticker";
    conversation.lastMessageAt = new Date();

    // Clear typing indicator
    conversation.typing.set(senderId, false);

    await conversation.save();

    const updatedConversation = await Conversation.findById(
      conversationId
    ).populate("participants", "firstName lastName picturePath");

    console.log("✅ Message sent");
    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: error.message });
  }
};

/* SEND IMAGE MESSAGE */
export const sendImageMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    console.log("📸 Sending image message");

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Image is already uploaded via multer/cloudinary
    const imageUrl = req.file.filename; // Cloudinary path

    const newMessage = {
      sender: senderId,
      content: "",
      type: "image",
      imageUrl: imageUrl,
      read: false,
      delivered: true,
      deliveredAt: new Date(),
      createdAt: new Date(),
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = "📷 Image";
    conversation.lastMessageAt = new Date();
    conversation.typing.set(senderId, false);

    await conversation.save();

    const updatedConversation = await Conversation.findById(
      conversationId
    ).populate("participants", "firstName lastName picturePath");

    console.log("✅ Image message sent");
    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error("❌ Error sending image:", error);
    res.status(500).json({ message: error.message });
  }
};

/* MARK MESSAGES AS READ */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    console.log("📖 Marking messages as read");

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    let markedCount = 0;
    conversation.messages.forEach((message) => {
      if (!message.read && message.sender.toString() !== userId && !message.deleted) {
        message.read = true;
        message.readAt = new Date();
        markedCount++;
      }
    });

    if (markedCount > 0) {
      await conversation.save();
      console.log(`✅ Marked ${markedCount} messages as read`);
    }

    res.status(200).json({ markedCount });
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE TYPING STATUS */
export const updateTypingStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId, isTyping } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.typing.set(userId, isTyping);
    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error updating typing status:", error);
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE LAST SEEN */
export const updateLastSeen = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.lastSeen.set(userId, new Date());
    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error updating last seen:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE MESSAGE */
export const deleteMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { userId } = req.body;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = conversation.messages.id(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    message.deleted = true;
    message.content = "This message was deleted";
    await conversation.save();

    const updatedConversation = await Conversation.findById(
      conversationId
    ).populate("participants", "firstName lastName picturePath");

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({ message: error.message });
  }
};

/* EDIT MESSAGE */
export const editMessage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.params;
    const { userId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = conversation.messages.id(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    message.content = content.trim();
    message.edited = true;
    await conversation.save();

    const updatedConversation = await Conversation.findById(
      conversationId
    ).populate("participants", "firstName lastName picturePath");

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error("❌ Error editing message:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET UNREAD COUNT */
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const conversations = await Conversation.find({
      participants: userId,
    });

    let totalUnread = 0;
    conversations.forEach((conv) => {
      const unread = conv.messages.filter(
        (msg) => !msg.read && msg.sender.toString() !== userId && !msg.deleted
      ).length;
      totalUnread += unread;
    });

    console.log(`📊 Total unread messages: ${totalUnread}`);
    res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE CONVERSATION */
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Conversation.findByIdAndDelete(conversationId);

    console.log("✅ Conversation deleted");
    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);
    res.status(500).json({ message: error.message });
  }
};
