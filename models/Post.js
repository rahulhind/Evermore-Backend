import mongoose from "mongoose";

// Comment Schema (for nested replies)
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firstName: {
      type: String,
      required: false, // ✅ Changed from true to false
      default: "Unknown", // ✅ Added default
    },
    lastName: {
      type: String,
      required: false, // ✅ Changed from true to false
      default: "User", // ✅ Added default
    },
    userPicturePath: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    likes: {
      type: Map,
      of: Boolean,
      default: () => new Map(),
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add self-reference for nested replies
commentSchema.add({
  replies: [commentSchema],
});

// Post Schema
const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    location: String,
    description: String,
    picturePath: String,
    userPicturePath: String,
    likes: {
      type: Map,
      of: Boolean,
      default: () => new Map(),
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
