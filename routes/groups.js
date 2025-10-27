import express from "express";
import {
  createGroup,
  getUserGroups,
  getGroupDetails,
  sendGroupMessage,
  markGroupMessagesAsRead,
  addMemberToGroup,
  removeMemberFromGroup,
  leaveGroup,
  updateGroupInfo,
  deleteGroup,
} from "../controllers/groups.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* CREATE & GET GROUPS */
router.post("/create", verifyToken, createGroup);
router.get("/:userId/groups", verifyToken, getUserGroups);
router.get("/:groupId", verifyToken, getGroupDetails);

/* SEND MESSAGES */
router.post("/:groupId/send", verifyToken, sendGroupMessage);
router.patch("/:groupId/read/:userId", verifyToken, markGroupMessagesAsRead);

/* MANAGE MEMBERS */
router.post("/:groupId/add-member", verifyToken, addMemberToGroup);
router.delete("/:groupId/remove/:memberId", verifyToken, removeMemberFromGroup);
router.post("/:groupId/leave", verifyToken, leaveGroup);

/* UPDATE & DELETE */
router.patch("/:groupId/update", verifyToken, updateGroupInfo);
router.delete("/:groupId", verifyToken, deleteGroup);

export default router;
