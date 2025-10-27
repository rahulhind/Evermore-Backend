import User from "../models/User.js";

/* READ */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );
    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const addRemoveFriend = async (req, res) => {
  try {
    const { id, friendId } = req.params;
    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter((id) => id !== friendId);
      friend.friends = friend.friends.filter((id) => id !== id);
    } else {
      user.friends.push(friendId);
      friend.friends.push(id);
    }
    await user.save();
    await friend.save();

    const friends = await Promise.all(
      user.friends.map((id) => User.findById(id))
    );
    const formattedFriends = friends.map(
      ({ _id, firstName, lastName, occupation, location, picturePath }) => {
        return { _id, firstName, lastName, occupation, location, picturePath };
      }
    );

    res.status(200).json(formattedFriends);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE ONLINE STATUS */
export const updateOnlineStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline, socketId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline,
        lastActive: new Date(),
        socketId: socketId || null,
      },
      { new: true }
    ).select("firstName lastName picturePath isOnline lastActive");

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error updating online status:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET ONLINE FRIENDS */
export const getOnlineFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const onlineFriends = await User.find({
      _id: { $in: user.friends },
      isOnline: true,
    }).select("firstName lastName picturePath isOnline lastActive");

    res.status(200).json(onlineFriends);
  } catch (error) {
    console.error("❌ Error fetching online friends:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET ALL FRIENDS (FOR CREATING GROUPS) */
export const getAllFriends = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = await User.find({
      _id: { $in: user.friends },
    }).select("firstName lastName picturePath isOnline");

    res.status(200).json(friends);
  } catch (error) {
    console.error("❌ Error fetching friends:", error);
    res.status(500).json({ message: error.message });
  }
};


/* SEARCH USERS */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    console.log("🔍 Searching users:", q);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query too short" });
    }

    // Search by first name or last name (case-insensitive)
    const users = await User.find({
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ],
    })
      .select("firstName lastName picturePath occupation isOnline")
      .limit(20);

    console.log(`✅ Found ${users.length} users`);
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error searching users:", error);
    res.status(500).json({ message: error.message });
  }
};
