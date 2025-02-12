import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", // Development
      "https://talk-nest-realtime-chat-app.vercel.app", // Deployed Frontend
      "https://talk-nest-realtime-chat-app-zsq6.vercel.app", // Staging/Test Environment
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

export function getReceiverSocketId(userId) {
  return userSoketMap[userId];
}

const userSoketMap = {}; // {userId: soketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSoketMap[userId] = socket.id;
  }

  // io.emit --> used to send the event to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSoketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnect", socket.id);
    if (userId) {
      delete userSoketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSoketMap));
  });
});

export { io, app, server };
