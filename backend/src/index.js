import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import messageRoute from "./routes/message.route.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";

import path from "path";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoute);

if (process.env.NODE_ENV === "production") {
  // if error comes from here, check the path of the frontend folder
  app.use(express.static(path.join(__dirname, "../frontend")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT " + PORT);
  connectDB();
});
