import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "sticker", "emoji"],
      default: "text",
    },
    imageUrl: String, // For image messages
    stickerUrl: String, // For sticker messages
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
    deleted: {
      type: Boolean,
      default: false,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId, // Reference to another message
    },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    // Typing indicators
    typing: {
      type: Map,
      of: Boolean,
      default: {},
    },
    // Last seen for each participant
    lastSeen: {
      type: Map,
      of: Date,
      default: {},
    },
    // Muted status
    muted: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ "messages.read": 1, "messages.sender": 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
