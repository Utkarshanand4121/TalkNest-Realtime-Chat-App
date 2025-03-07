import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something wrong while creating access and refresh Token"
    );
  }
};

const signupController = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((field) => field?.trim === "")) {
    throw new ApiError(400, "Some fields are missing.");
  }

  if (password.length < 5) {
    throw new ApiError(400, "Password is must be atleast 6 character.");
  }

  const user = await User.findOne({ email: req.body.email });
  if (user) {
    throw new ApiError(400, "User already exists");
  }

  // hash Password
  // const salt = await bcrypt.genSalt(10);
  // const hashPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    fullName,
    email,
    password,
  });

  const createdUser = await User.findById(newUser._id).select("-password -refreshToken");
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(createdUser._id);

  if (!createdUser) {
    throw ApiError(501, "User not created");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
          refreshToken,
        },
        "Signup Successful & User Logged In"
      )
    );
});

const loginController = asyncHandler(async (req, res) => {
  const { email, fullName, password } = req.body;

  if (!(fullName || email)) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findOne({
    $or: [{ fullName }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User not exist");
  }

  const passwordCorrect = await user.isPasswordCorrect(password);
  if (!passwordCorrect) {
    throw new ApiError(400, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutController = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Secure only in production
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logout Successfully"));
});

const updateProfileController = asyncHandler(async (req, res, next) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const checkAuth = asyncHandler(async (req, res) => {
  const authUser = req.user;

  if (!authUser) {
    throw new ApiError(401, "User not authorized");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, authUser, "User authorized"));
});

export {
  signupController,
  loginController,
  logoutController,
  updateProfileController,
  checkAuth,
};
