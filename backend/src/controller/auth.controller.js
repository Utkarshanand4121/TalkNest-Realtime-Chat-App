import User from "../models/user.module.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const signupController = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if ([fullName, email, password].some((field) => field?.trim === "")) {
    throw new ApiError(400, "Some fields are missing.");
  }

  if (password.length() < 5) {
    throw new ApiError(400, "Password is must be atleast 6 character.");
  }

  const user = await User.findOne({ email: req.body.email });
  if (user) {
    throw new ApiError(400, "User already exists");
  }

  // hash Password
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    fullName,
    email,
    password: hashPassword,
  });
  if (newUser) {
    // generate jwt token here
  } else {
    throw new ApiError(400, "Invalid user data");
  }
});

const loginController = (req, res) => {
  res.send("login route");
};

const logoutController = (req, res) => {
  res.send("logout route");
};

export { signupController, loginController, logoutController };
