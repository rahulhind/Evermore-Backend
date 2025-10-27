import express from "express";
import {
  getUser,
  getUserFriends,
  addRemoveFriend,
  updateOnlineStatus,
  getOnlineFriends, 
  getAllFriends, 
  searchUsers
} from "../controllers/users.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ✅ SPECIFIC ROUTES FIRST (before generic /:id routes) */
router.get("/search", verifyToken, searchUsers);
router.patch("/:userId/online-status", verifyToken, updateOnlineStatus);
router.get("/:userId/online-friends", verifyToken, getOnlineFriends);
router.get("/:userId/all-friends", verifyToken, getAllFriends);
router.get("/:id/friends", verifyToken, getUserFriends);

/* ✅ GENERIC ROUTES LAST */
router.get("/:id", verifyToken, getUser);
router.patch("/:id/:friendId", verifyToken, addRemoveFriend);

export default router;
