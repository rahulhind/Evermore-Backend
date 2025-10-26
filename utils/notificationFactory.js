// Notification templates for different types
export const notificationTemplates = {
  // ========== SOCIAL NOTIFICATIONS ==========
  like: {
    category: "social",
    type: "like",
    priority: "low",
    icon: "❤️",
    getMessage: (sender, metadata) => {
      const name = sender ? `${sender.firstName || 'Someone'} ${sender.lastName || ''}`.trim() : 'Someone';
      return `${name} liked your ${metadata.postType || "post"}`;
    },
    getLink: (metadata) => `/post/${metadata.postId}`,
  },

  comment: {
    category: "social",
    type: "comment",
    priority: "medium",
    icon: "💬",
    getMessage: (sender, metadata) => {
      const name = sender ? `${sender.firstName || 'Someone'} ${sender.lastName || ''}`.trim() : 'Someone';
      const preview = metadata.commentPreview ? `: "${metadata.commentPreview}"` : '';
      return `${name} commented${preview}`;
    },
    getLink: (metadata) => `/post/${metadata.postId}`,
  },

  reply: {
    category: "social",
    type: "reply",
    priority: "medium",
    icon: "↩️",
    getMessage: (sender, metadata) => {
      const name = sender ? `${sender.firstName || 'Someone'} ${sender.lastName || ''}`.trim() : 'Someone';
      return `${name} replied to your comment`;
    },
    getLink: (metadata) => `/post/${metadata.postId}`,
  },

  follow: {
    category: "social",
    type: "follow",
    priority: "medium",
    icon: "👤",
    getMessage: (sender) => {
      const name = sender ? `${sender.firstName || 'Someone'} ${sender.lastName || ''}`.trim() : 'Someone';
      return `${name} started following you`;
    },
    getLink: (metadata) => `/profile/${metadata.userId}`,
    actions: [
      {
        label: "Follow Back",
        action: "api_call",
        value: (metadata) => `/users/${metadata.userId}/follow`,
        style: "primary",
      },
    ],
  },

  // ========== SECURITY NOTIFICATIONS ==========
  login_alert: {
    category: "security",
    type: "login_alert",
    priority: "high",
    icon: "🔐",
    title: "New Login Detected",
    getMessage: (sender, metadata) =>
      `New login from ${metadata.device} in ${metadata.location}`,
    actions: [
      {
        label: "This was me",
        action: "api_call",
        value: (metadata) => `/security/confirm-login/${metadata.loginId}`,
        style: "primary",
      },
      {
        label: "Not me - Secure Account",
        action: "navigate",
        value: "/settings/security",
        style: "danger",
      },
    ],
  },

  password_changed: {
    category: "security",
    type: "password_changed",
    priority: "high",
    icon: "🔒",
    title: "Password Changed",
    getMessage: () => "Your password was successfully changed",
    actions: [
      {
        label: "I didn't do this",
        action: "navigate",
        value: "/settings/security",
        style: "danger",
      },
    ],
  },

  suspicious_activity: {
    category: "security",
    type: "suspicious_activity",
    priority: "urgent",
    icon: "⚠️",
    title: "Suspicious Activity Detected",
    getMessage: (sender, metadata) => metadata.description,
    actions: [
      {
        label: "Review Activity",
        action: "navigate",
        value: "/settings/security/activity",
        style: "danger",
      },
    ],
  },

  // ========== SUGGESTION NOTIFICATIONS ==========
  friend_suggestion: {
    category: "suggestion",
    type: "friend_suggestion",
    priority: "low",
    icon: "👥",
    title: "People You May Know",
    getMessage: (sender, metadata) =>
      `${metadata.mutualFriends} mutual friends with ${metadata.suggestedUser}`,
    getLink: (metadata) => `/profile/${metadata.userId}`,
    image: (metadata) => metadata.userImage,
    actions: [
      {
        label: "View Profile",
        action: "navigate",
        value: (metadata) => `/profile/${metadata.userId}`,
        style: "primary",
      },
      {
        label: "Dismiss",
        action: "dismiss",
        style: "secondary",
      },
    ],
  },

  content_recommendation: {
    category: "suggestion",
    type: "content_recommendation",
    priority: "low",
    icon: "✨",
    title: "Recommended for You",
    getMessage: (sender, metadata) =>
      `Check out posts about ${metadata.topic}`,
    getLink: (metadata) => `/explore/${metadata.topic}`,
  },

  // ========== PROMOTION NOTIFICATIONS ==========
  sponsored_content: {
    category: "promotion",
    type: "sponsored_content",
    priority: "low",
    icon: "📢",
    title: "Sponsored",
    getMessage: (sender, metadata) => metadata.adContent,
    image: (metadata) => metadata.adImage,
    getLink: (metadata) => metadata.adLink,
    actions: [
      {
        label: (metadata) => metadata?.cta || "Learn More",
        action: "navigate",
        value: (metadata) => metadata.adLink,
        style: "primary",
      },
    ],
  },

  // ========== SYSTEM NOTIFICATIONS ==========
  system_update: {
    category: "system",
    type: "system_update",
    priority: "medium",
    icon: "🔔",
    title: "System Update",
    getMessage: (sender, metadata) => metadata.updateMessage,
    actions: [
      {
        label: "View Details",
        action: "navigate",
        value: "/updates",
        style: "primary",
      },
    ],
  },

  maintenance: {
    category: "system",
    type: "maintenance",
    priority: "high",
    icon: "🔧",
    title: "Scheduled Maintenance",
    getMessage: (sender, metadata) =>
      `Maintenance scheduled for ${metadata.scheduledTime}`,
  },

  // ========== ACHIEVEMENT NOTIFICATIONS ==========
  milestone: {
    category: "achievement",
    type: "milestone",
    priority: "medium",
    icon: "🎉",
    title: "Milestone Achieved!",
    getMessage: (sender, metadata) => metadata.achievement,
    image: (metadata) => metadata.badgeImage,
  },

  // ========== GROUP NOTIFICATIONS ==========
  group_invite: {
    category: "group",
    type: "group_invite",
    priority: "medium",
    icon: "👥",
    getMessage: (sender, metadata) =>
      `${sender.firstName} ${sender.lastName} invited you to join "${metadata.groupName}"`,
    getLink: (metadata) => `/group/${metadata.groupId}`,
    actions: [
      {
        label: "Accept",
        action: "api_call",
        value: (metadata) => `/groups/${metadata.groupId}/accept-invite`,
        style: "primary",
      },
      {
        label: "Decline",
        action: "api_call",
        value: (metadata) => `/groups/${metadata.groupId}/decline-invite`,
        style: "secondary",
      },
    ],
  },
};

// Helper function to resolve dynamic values
const resolveValue = (template, metadata) => {
  if (typeof template === "function") {
    return template(metadata);
  }
  return template;
};

// Factory function to create notifications
export const createNotificationData = (
  type,
  { sender, recipient, metadata = {} }
) => {
  const template = notificationTemplates[type];

  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  console.log("🏭 Factory creating notification data:");
  console.log("  Type:", type);
  console.log("  Sender:", sender);
  console.log("  Sender type:", typeof sender);
  console.log("  Has firstName?", sender?.firstName);
  console.log("  Has lastName?", sender?.lastName);
  console.log("  Recipient:", recipient);

  // ✅ Validate sender
  if (!sender) {
    console.error("❌ Sender is null/undefined in factory");
    throw new Error("Sender is required for notification creation");
  }

  // ✅ Ensure sender is a proper object with name fields
  let senderObject = sender;
  if (typeof sender === 'string') {
    console.error("❌ Sender is still a string ID in factory, should be user object");
    throw new Error("Sender must be a user object, not an ID string");
  }

  // ✅ Validate sender has required fields
  if (!senderObject.firstName || !senderObject.lastName) {
    console.error("❌ Sender missing name fields:", senderObject);
    throw new Error("Sender must have firstName and lastName");
  }

  console.log("✅ Sender validated:", senderObject.firstName, senderObject.lastName);

  // Create the message using the template
  let message;
  try {
    message = typeof template.getMessage === "function"
      ? template.getMessage(senderObject, metadata)
      : template.getMessage;
    console.log("✅ Message created:", message);
  } catch (msgError) {
    console.error("❌ Error creating message:", msgError);
    throw msgError;
  }

  const notification = {
    recipient,
    sender: senderObject._id || senderObject, // Store sender ID
    category: template.category,
    type: template.type,
    priority: template.priority,
    icon: template.icon,
    title: template.title,
    message: message,
    link: resolveValue(template.getLink, metadata),
    image: resolveValue(template.image, metadata),
    metadata,
  };

  // Add actions if they exist
  if (template.actions) {
    notification.actions = template.actions.map((action) => ({
      label: resolveValue(action.label, metadata),
      action: action.action,
      value: resolveValue(action.value, metadata),
      style: action.style,
    }));
  }

  // Add related entities
  if (metadata.postId) notification.relatedPost = metadata.postId;
  if (metadata.commentId) notification.relatedComment = metadata.commentId;
  if (metadata.userId) notification.relatedUser = metadata.userId;

  // Add expiration for promotions/suggestions
  if (template.category === "promotion" || template.category === "suggestion") {
    notification.expiresAt = new Date(
      Date.now() + (metadata.expiresInDays || 7) * 24 * 60 * 60 * 1000
    );
  }

  console.log("✅ Notification data created successfully");
  return notification;
};

