import Message from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "cloudinary";

const getUsersForSidebar = asyncHandler(async (req, res) => {
  const loggedInUserId = req.user._id;
  if (!loggedInUserId) {
    throw new ApiError(400, "Users not loggedIn");
  }
  const filteredUsers = await User.find({
    _id: { $ne: loggedInUserId },
  }).select("-password");

  return res.status(200).json(200, filteredUsers, "Users fetched successfully");
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

  return res
    .status(200)
    .json(new ApiResponse(200, messages, "GetMessages fetched"));
});

const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  let imageUrl;
  if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
  }

  const newMessage = new Message({
    senderId,
    receiverId,
    text,
    image: imageUrl,
  });

  await newMessage.save();

  // todo: realtime functionality goes here => socket.io

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Message send succesfully"));
});

export { getUsersForSidebar, getMessage, sendMessage };
