import Post from "../models/Post.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";

/* CREATE POST */
export const createPost = async (req, res) => {
  try {
    const { userId, description } = req.body;
    let path = "Empty Path";
    if (req.file) path = req.file.filename;

    const user = await User.findById(userId);
    const newPost = new Post({
      userId,
      firstName: user.firstName,
      lastName: user.lastName,
      location: user.location,
      description,
      userPicturePath: user.picturePath,
      picturePath: path,
      likes: {},
      comments: [],
    });

    await newPost.save();
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(201).json(posts);
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ POSTS */
export const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* LIKE POST */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.get(userId);
    if (isLiked) {
      post.likes.delete(userId);
    } else {
      post.likes.set(userId, true);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { likes: post.likes },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* ADD COMMENT */
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newComment = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      content: content.trim(),
      likes: {},
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* EDIT COMMENT */
export const editComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId, content } = req.body;

    console.log("=".repeat(60));
    console.log("✏️ EDIT COMMENT");
    console.log("Post ID:", id);
    console.log("Comment ID:", commentId);
    console.log("User ID:", userId);
    console.log("Content:", content);

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      console.log("❌ Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("✅ Post found");
    console.log("Total comments:", post.comments.length);
    
    // Log all comment IDs
    console.log("All comment IDs in post:");
    post.comments.forEach((c, index) => {
      console.log(`  [${index}] ${c._id.toString()}`);
    });

    // Find comment (check both top-level and nested replies)
    let comment = post.comments.id(commentId);

    if (!comment) {
      console.log("Not found in top-level, searching replies...");
      // Search in replies
      for (let i = 0; i < post.comments.length; i++) {
        const topComment = post.comments[i];
        if (topComment.replies && Array.isArray(topComment.replies)) {
          console.log(`  Checking replies of comment ${i} (${topComment.replies.length} replies)`);
          
          const reply = topComment.replies.find(
            (r) => r._id && r._id.toString() === commentId
          );
          
          if (reply) {
            comment = reply;
            console.log("✅ Found in replies");
            break;
          }
        }
      }
    } else {
      console.log("✅ Found in top-level comments");
    }

    if (!comment) {
      console.log("❌ Comment not found with ID:", commentId);
      console.log("=".repeat(60));
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check ownership
    console.log("Comment userId:", comment.userId.toString());
    console.log("Request userId:", userId);
    
    if (comment.userId.toString() !== userId) {
      console.log("❌ Unauthorized - userId mismatch");
      return res.status(403).json({ message: "Unauthorized" });
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();
    comment.isEdited = true;

    console.log("💾 Saving post...");
    await post.save();
    
    console.log("✅ Comment edited successfully");
    console.log("=".repeat(60));
    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Error in editComment:", err);
    console.error("Stack trace:", err.stack);
    console.error("=".repeat(60));
    res.status(500).json({ message: err.message });
  }
};
/* DELETE COMMENT */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId } = req.body;

    console.log("=".repeat(60));
    console.log("🗑️ DELETE COMMENT");
    console.log("Post ID:", id);
    console.log("Comment ID:", commentId);
    console.log("User ID:", userId);

    const post = await Post.findById(id);
    if (!post) {
      console.log("❌ Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("✅ Post found");
    console.log("Total comments:", post.comments.length);
    
    // Log all comment IDs
    console.log("All comment IDs in post:");
    post.comments.forEach((c, index) => {
      console.log(`  [${index}] ${c._id.toString()} - userId: ${c.userId.toString()}`);
      if (c.replies && c.replies.length > 0) {
        c.replies.forEach((r, rIndex) => {
          console.log(`    Reply [${rIndex}] ${r._id.toString()} - userId: ${r.userId.toString()}`);
        });
      }
    });

    // Try to find and remove top-level comment
    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId && c.userId.toString() === userId
    );

    if (commentIndex !== -1) {
      console.log(`✅ Found top-level comment at index ${commentIndex}`);
      post.comments.splice(commentIndex, 1);
      await post.save();
      console.log("✅ Top-level comment deleted");
      console.log("=".repeat(60));
      return res.status(200).json(post);
    }

    console.log("Not found in top-level, searching replies...");
    // If not found, search in replies
    for (let i = 0; i < post.comments.length; i++) {
      const topComment = post.comments[i];
      if (topComment.replies && Array.isArray(topComment.replies)) {
        console.log(`  Checking replies of comment ${i}`);
        
        const replyIndex = topComment.replies.findIndex(
          (r) => r._id && r._id.toString() === commentId && r.userId.toString() === userId
        );

        if (replyIndex !== -1) {
          console.log(`✅ Found reply at index ${replyIndex}`);
          topComment.replies.splice(replyIndex, 1);
          await post.save();
          console.log("✅ Reply deleted");
          console.log("=".repeat(60));
          return res.status(200).json(post);
        }
      }
    }

    console.log("❌ Comment not found or unauthorized");
    console.log("=".repeat(60));
    return res.status(404).json({ message: "Comment not found or unauthorized" });
  } catch (err) {
    console.error("❌ Error in deleteComment:", err);
    console.error("Stack trace:", err.stack);
    console.error("=".repeat(60));
    res.status(500).json({ message: err.message });
  }
};

/* LIKE COMMENT */
export const likeComment = async (req, res) => {
  try {
    console.log("❤️ likeComment called");
    console.log("Params:", req.params);
    console.log("Body:", req.body);
    
    const { id, commentId } = req.params;
    const { userId } = req.body;

    const post = await Post.findById(id);
    if (!post) {
      console.log("❌ Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    // Find comment (check both top-level and nested replies)
    let comment = post.comments.id(commentId);

    if (!comment) {
      console.log("Not found in top-level, searching replies...");
      // Search in replies using find() instead of id()
      for (const topComment of post.comments) {
        if (topComment.replies && Array.isArray(topComment.replies)) {
          // ✅ Use find() instead of id()
          const reply = topComment.replies.find(
            (r) => r._id && r._id.toString() === commentId
          );
          if (reply) {
            comment = reply;
            console.log("✅ Found in replies");
            break;
          }
        }
      }
    }

    if (!comment) {
      console.log("❌ Comment not found");
      return res.status(404).json({ message: "Comment not found" });
    }

    // Initialize likes if doesn't exist
    if (!comment.likes) {
      console.log("Initializing likes Map");
      comment.likes = new Map();
    }

    // Toggle like
    const isLiked = comment.likes.get(userId);
    console.log("Current like status:", isLiked);
    
    if (isLiked) {
      comment.likes.delete(userId);
      console.log("Unliked");
    } else {
      comment.likes.set(userId, true);
      console.log("Liked");
    }

    console.log("💾 Saving post...");
    await post.save();
    
    console.log("✅ Comment like toggled successfully");
    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Error in likeComment:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ message: err.message });
  }
};


/* REPLY TO COMMENT */
export const replyToComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { userId, content } = req.body;

    console.log("=".repeat(60));
    console.log("💬 REPLY TO COMMENT");
    console.log("Post ID:", id);
    console.log("Parent Comment ID:", commentId);
    console.log("User ID:", userId);
    console.log("Content:", content);

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      console.log("❌ Post not found");
      return res.status(404).json({ message: "Post not found" });
    }

    console.log("✅ Post found");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("✅ User found");

    // Find the parent comment (check both top-level and nested replies)
    let parentComment = post.comments.id(commentId);

    if (!parentComment) {
      console.log("Not found in top-level, searching in replies...");
      // Search in replies
      for (const topComment of post.comments) {
        if (topComment.replies && Array.isArray(topComment.replies)) {
          const reply = topComment.replies.find(
            (r) => r._id && r._id.toString() === commentId
          );
          if (reply) {
            parentComment = reply;
            console.log("✅ Found parent in nested replies");
            break;
          }
        }
      }
    } else {
      console.log("✅ Found parent in top-level comments");
    }

    if (!parentComment) {
      console.log("❌ Parent comment not found with ID:", commentId);
      console.log("Available comment IDs:");
      post.comments.forEach((c, i) => {
        console.log(`  [${i}] ${c._id.toString()}`);
        if (c.replies && c.replies.length > 0) {
          c.replies.forEach((r, j) => {
            console.log(`    Reply [${j}] ${r._id.toString()}`);
          });
        }
      });
      console.log("=".repeat(60));
      return res.status(404).json({ message: "Parent comment not found" });
    }

    const newReply = {
      userId: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      userPicturePath: user.picturePath,
      content: content.trim(),
      likes: new Map(),
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📝 Creating new reply");
    
    // Initialize replies array if it doesn't exist
    if (!parentComment.replies) {
      parentComment.replies = [];
    }

    parentComment.replies.push(newReply);
    
    console.log("💾 Saving post...");
    await post.save();

    console.log("✅ Reply added successfully");
    console.log("=".repeat(60));
    res.status(200).json(post);
  } catch (err) {
    console.error("❌ Error in replyToComment:", err);
    console.error("Stack trace:", err.stack);
    console.error("=".repeat(60));
    res.status(500).json({ message: err.message });
  }
};
