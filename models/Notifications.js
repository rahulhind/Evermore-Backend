import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required for system notifications
    },
    category: {
      type: String,
      enum: [
        "social",      // Likes, comments, follows
        "system",      // System updates, maintenance
        "security",    // Login alerts, password changes
        "promotion",   // Ads, sponsored content
        "suggestion",  // Friend suggestions, content recommendations
        "achievement", // Badges, milestones
        "message",     // Direct messages
        "group",       // Group invitations, updates
      ],
      required: true,
      default: "social",
    },
    type: {
      type: String,
      required: true,
      // Examples: "like", "comment", "follow", "login_alert", "ad", "friend_suggestion"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    title: {
      type: String,
      // For system notifications, promotions
    },
    message: {
      type: String,
      required: true,
    },
    // Rich content support
    image: {
      type: String, // URL or Cloudinary path
    },
    icon: {
      type: String, // Icon name or emoji
    },
    // Action buttons
    actions: [
      {
        label: String,
        action: String, // "navigate", "api_call", "dismiss"
        value: String,  // URL or API endpoint
        style: {
          type: String,
          enum: ["primary", "secondary", "danger"],
          default: "primary",
        },
      },
    ],
    // Related entities
    relatedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    relatedComment: String,
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Navigation
    link: String,
    // Custom data for extensibility
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Status
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    clicked: {
      type: Boolean,
      default: false,
    },
    dismissed: {
      type: Boolean,
      default: false,
    },
    // Expiration (for time-sensitive notifications like promotions)
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1, category: 1 });
notificationSchema.index({ recipient: 1, dismissed: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
