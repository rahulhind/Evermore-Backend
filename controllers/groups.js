import Group from "../models/Groups.js";
import User from "../models/User.js";

/* CREATE GROUP */
export const createGroup = async (req, res) => {
  try {
    const { adminId, name, description, memberIds } = req.body;

    console.log("📝 Creating group:", name);

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (!memberIds || memberIds.length < 2) {
      return res.status(400).json({ 
        message: "At least 2 members required (excluding admin)" 
      });
    }

    // Verify all members exist
    const members = await User.find({ _id: { $in: memberIds } });
    if (members.length !== memberIds.length) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // Create group with admin and members
    const allMembers = [adminId, ...memberIds.filter(id => id !== adminId)];

    const newGroup = new Group({
      name: name.trim(),
      description: description?.trim() || "",
      admin: adminId,
      members: allMembers,
      messages: [{
        sender: adminId,
        content: "Group created",
        type: "system",
        createdAt: new Date(),
      }],
      lastMessage: "Group created",
      lastMessageAt: new Date(),
    });

    await newGroup.save();

    const populatedGroup = await Group.findById(newGroup._id)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    console.log("✅ Group created:", populatedGroup._id);
    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("❌ Error creating group:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET USER GROUPS */
export const getUserGroups = async (req, res) => {
  try {
    const { userId } = req.params;

    const groups = await Group.find({ members: userId })
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive")
      .sort({ lastMessageAt: -1 });

    // Calculate unread counts
    const groupsWithUnread = groups.map((group) => {
      const unreadCount = group.messages.filter((msg) => {
        const hasRead = msg.readBy.some(
          (r) => r.user.toString() === userId
        );
        return !hasRead && msg.sender.toString() !== userId && msg.type !== "system";
      }).length;

      return {
        ...group.toObject(),
        unreadCount,
      };
    });

    console.log(`✅ Found ${groups.length} groups for user ${userId}`);
    res.status(200).json(groupsWithUnread);
  } catch (error) {
    console.error("❌ Error fetching groups:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET GROUP DETAILS */
export const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("❌ Error fetching group:", error);
    res.status(500).json({ message: error.message });
  }
};

/* SEND GROUP MESSAGE */
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { senderId, content, type = "text" } = req.body;

    console.log("📨 Sending group message");

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const newMessage = {
      sender: senderId,
      content: content?.trim() || "",
      type,
      readBy: [{ user: senderId, readAt: new Date() }],
      createdAt: new Date(),
    };

    group.messages.push(newMessage);
    group.lastMessage = type === "text" ? content?.trim().substring(0, 100) : "📷 Image";
    group.lastMessageAt = new Date();
    group.typing.set(senderId, false);

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    console.log("✅ Group message sent");
    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error sending group message:", error);
    res.status(500).json({ message: error.message });
  }
};

/* MARK GROUP MESSAGES AS READ */
export const markGroupMessagesAsRead = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    let markedCount = 0;
    group.messages.forEach((message) => {
      const alreadyRead = message.readBy.some(
        (r) => r.user.toString() === userId
      );
      
      if (!alreadyRead && message.sender.toString() !== userId) {
        message.readBy.push({ user: userId, readAt: new Date() });
        markedCount++;
      }
    });

    if (markedCount > 0) {
      await group.save();
    }

    res.status(200).json({ markedCount });
  } catch (error) {
    console.error("❌ Error marking group messages as read:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ADD MEMBER TO GROUP */
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, newMemberId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    if (group.members.includes(newMemberId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    const newMember = await User.findById(newMemberId);
    if (!newMember) {
      return res.status(404).json({ message: "User not found" });
    }

    group.members.push(newMemberId);
    
    // Add system message
    group.messages.push({
      sender: adminId,
      content: `${newMember.firstName} ${newMember.lastName} was added to the group`,
      type: "system",
      readBy: [],
      createdAt: new Date(),
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error adding member:", error);
    res.status(500).json({ message: error.message });
  }
};

/* REMOVE MEMBER FROM GROUP */
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { adminId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    if (memberId === adminId) {
      return res.status(400).json({ message: "Admin cannot remove themselves" });
    }

    const member = await User.findById(memberId);
    group.members = group.members.filter((m) => m.toString() !== memberId);

    // Add system message
    group.messages.push({
      sender: adminId,
      content: `${member.firstName} ${member.lastName} was removed from the group`,
      type: "system",
      readBy: [],
      createdAt: new Date(),
    });

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error removing member:", error);
    res.status(500).json({ message: error.message });
  }
};

/* LEAVE GROUP */
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() === userId) {
      return res.status(400).json({ 
        message: "Admin cannot leave. Transfer admin rights first" 
      });
    }

    const user = await User.findById(userId);
    group.members = group.members.filter((m) => m.toString() !== userId);

    // Add system message
    group.messages.push({
      sender: userId,
      content: `${user.firstName} ${user.lastName} left the group`,
      type: "system",
      readBy: [],
      createdAt: new Date(),
    });

    await group.save();

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("❌ Error leaving group:", error);
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE GROUP INFO */
export const updateGroupInfo = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, name, description } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can update group info" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    await group.save();

    const updatedGroup = await Group.findById(groupId)
      .populate("admin", "firstName lastName picturePath")
      .populate("members", "firstName lastName picturePath isOnline lastActive");

    res.status(200).json(updatedGroup);
  } catch (error) {
    console.error("❌ Error updating group:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE GROUP */
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.admin.toString() !== adminId) {
      return res.status(403).json({ message: "Only admin can delete the group" });
    }

    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting group:", error);
    res.status(500).json({ message: error.message });
  }
};
