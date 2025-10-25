import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixComments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Use direct MongoDB operations to bypass validation
    const db = mongoose.connection.db;
    const postsCollection = db.collection("posts");

    const posts = await postsCollection.find({}).toArray();
    console.log(`📦 Found ${posts.length} posts`);

    let updatedCount = 0;

    for (const post of posts) {
      let needsUpdate = false;
      const updatedComments = [];

      if (post.comments && Array.isArray(post.comments)) {
        console.log(`\n📝 Processing post ${post._id} with ${post.comments.length} comments`);

        post.comments.forEach((comment, index) => {
          console.log(`  Comment ${index}:`, {
            hasUserId: !!comment.userId,
            hasFirstName: !!comment.firstName,
            hasLastName: !!comment.lastName,
            hasContent: !!comment.content,
          });

          // Create a fixed comment
          const fixedComment = {
            ...comment,
            userId: comment.userId || new mongoose.Types.ObjectId(),
            firstName: comment.firstName || "Unknown",
            lastName: comment.lastName || "User",
            content: comment.content || "[No content]",
            userPicturePath: comment.userPicturePath || "",
            likes: comment.likes || {},
            replies: [],
            isEdited: comment.isEdited || false,
            createdAt: comment.createdAt || new Date(),
            updatedAt: comment.updatedAt || new Date(),
            _id: comment._id || new mongoose.Types.ObjectId(),
          };

          // Fix replies if they exist
          if (comment.replies && Array.isArray(comment.replies)) {
            fixedComment.replies = comment.replies.map((reply) => ({
              ...reply,
              userId: reply.userId || new mongoose.Types.ObjectId(),
              firstName: reply.firstName || "Unknown",
              lastName: reply.lastName || "User",
              content: reply.content || "[No content]",
              userPicturePath: reply.userPicturePath || "",
              likes: reply.likes || {},
              replies: [],
              isEdited: reply.isEdited || false,
              createdAt: reply.createdAt || new Date(),
              updatedAt: reply.updatedAt || new Date(),
              _id: reply._id || new mongoose.Types.ObjectId(),
            }));
          }

          updatedComments.push(fixedComment);
          needsUpdate = true;
        });
      }

      if (needsUpdate) {
        // Update using direct MongoDB operation to bypass Mongoose validation
        await postsCollection.updateOne(
          { _id: post._id },
          { $set: { comments: updatedComments } }
        );
        updatedCount++;
        console.log(`  ✅ Updated post ${post._id}`);
      }
    }

    console.log(`\n🎉 Migration complete! Updated ${updatedCount} posts`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration error:", error);
    console.error("Stack:", error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

fixComments();
