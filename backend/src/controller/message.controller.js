import Message from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../utils/cloudinary.js";

const getUsersForSidebar = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  if (!loggedInUserId) {
    throw new ApiError(400, "Users not loggedIn");
  }
  const filteredUsers = await User.find({
    _id: { $ne: loggedInUserId },
  }).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, filteredUsers, "Users fetched successfully"));
});

const getMessage = asyncHandler(async (req, res) => {
  const { id: usersToChatId } = req.params;
  const myId = req.user._id;

  if (!myId) {
    throw new ApiError(401, "User not authorized");
  }

  const messages = await Message.find({
    $or: [
      { senderId: myId, receiverId: usersToChatId },
      { senderId: usersToChatId, receiverId: myId },
    ],
  });
  // console.log("Sender ID:", senderId);
  // console.log("Receiver ID:", receiverId);
  // console.log("Message Data:", req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, messages || [], "GetMessages fetched"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  let imageUrl;
  if (image) {
    try {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      throw new ApiError(500, "Image upload failed");
    }
  }

  const newMessage = new Message({
    senderId,
    receiverId,
    text,
    image: imageUrl,
  });

  await newMessage.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

export { getUsersForSidebar, getMessage, sendMessage };
