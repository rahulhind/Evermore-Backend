import { createNotification } from "../controllers/notifications.js";
import User from "../models/User.js";

// Send notification to all users
export const sendNotificationToAll = async (type, metadata) => {
  const users = await User.find({}, "_id");
  
  for (const user of users) {
    await createNotification(type, {
      sender: null,
      recipient: user._id,
      metadata,
    });
  }
  
  console.log(`Sent ${type} notification to ${users.length} users`);
};

// Example usage:
// sendNotificationToAll("system_update", {
//   updateMessage: "We've added new features!",
// });
