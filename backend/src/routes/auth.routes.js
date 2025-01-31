import express from "express";
import {
  checkAuth,
  loginController,
  logoutController,
  signupController,
  updateProfileController,
} from "../controller/auth.controller.js";
import { verifyJWTUser } from "./../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/signup", signupController);

router.post("/login", loginController);

router.route("/logout").post(verifyJWTUser, logoutController);

router.route("/update-profile").put(verifyJWTUser, updateProfileController);

router.route("/check").get(verifyJWTUser, checkAuth);

export default router;
