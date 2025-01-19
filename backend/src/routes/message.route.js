import express from "express";
import { verifyJWTUser } from "../middlewares/user.middlewares.js";
import {
  getMessage,
  getUsersForSidebar,
  sendMessage,
} from "../controller/message.controller.js";

const router = express.Router();

router.route("/users").get(verifyJWTUser, getUsersForSidebar);
router.route("/:id").get(verifyJWTUser, getMessage);
router.route("/send/:id").post(verifyJWTUser, sendMessage);

export default router;
