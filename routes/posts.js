import express from "express";
import {
  getFeedPosts,
  getUserPosts,
  likePost,
  addComment,
  editComment,
  deleteComment,
  likeComment,
  replyToComment,
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* READ - All Posts (most specific path) */
router.get("/", verifyToken, getFeedPosts);

/* COMMENT ROUTES - These MUST come before /:userId/posts */
// Add comment to post
router.post("/:id/comment", verifyToken, addComment);

// Reply to a comment
router.post("/:id/comment/:commentId/reply", verifyToken, replyToComment);

// Edit comment
router.patch("/:id/comment/:commentId", verifyToken, editComment);

// Like comment (MUST be after edit route for specificity)
router.patch("/:id/comment/:commentId/like", verifyToken, likeComment);

// Delete comment
router.delete("/:id/comment/:commentId", verifyToken, deleteComment);

/* POST LIKE */
router.patch("/:id/like", verifyToken, likePost);

/* READ - User Posts (MUST be LAST - it's the most generic) */
router.get("/:userId/posts", verifyToken, getUserPosts);

export default router;
