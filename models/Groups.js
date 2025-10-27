import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
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
      enum: ["text", "image", "system"], // system for "User joined" etc
      default: "text",
    },
    imageUrl: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: Date,
    }],
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    groupImage: {
      type: String,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    messages: [groupMessageSchema],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    typing: {
      type: Map,
      of: Boolean,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
groupSchema.index({ members: 1, lastMessageAt: -1 });
groupSchema.index({ admin: 1 });

const Group = mongoose.model("Group", groupSchema);

export default Group;
