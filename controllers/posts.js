import Post from "../models/Post.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
/* CREATE */
export const createPost = async (req, res) => {
  try {
    const { userId, description} = req.body;
    //console.log("Req File", req.file);
    let path = "Empty Path";
    if (req.file)
      path = req.file.filename;
    //console.log("Desc ", description);
    const user = await User.findById(userId);
    // console.log("user is", user);
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
    console.log("newPost is", newPost);
    await newPost.save();

    const post = await Post.find();
    // console.log("post is ", post);

    //Only one response can be sent
    res.status(201).json(post);
  //  res.status(200).json({ success: true });
  } catch (err) {
    res.status(409).json({ message: err.message });
  }
};

/* READ */
export const getFeedPosts = async (req, res) => {
  try {
    console.log("Inside getFeedPosts");
    const post = await Post.find();
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    console.log("Coming to User Post");
    const { userId } = req.params;
    const post = await Post.find({ userId });
    res.status(200).json(post);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

/* UPDATE */
export const commentPost = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    // Find the post by postId
    //console.log("postId is ", id);
    const post = await Post.findById(id);
    //console.log("post is ", post);
    if (!post) {
      //console.log("error at 63");
      return res.status(404).json({ message: "Post not found" });
    }
    //console.log("Coming");
    // Find the comment in the post's comments array
    //const comment = post.comments.find((c) => c._id.toString() === commentId);
    post.comments.push({ content: content });
    // if (comment) {
    //   console.log("error at 71");
    //   return res.status(404).json({ message: 'Comment not found' });
    // }

    // // Update the comment content
    // comment.content = updatedComment;

    // Save the updated post
    await post.save();
    res.status(200).json({ message: "Comment updated successfully", post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const post = await Post.findById(id);
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
