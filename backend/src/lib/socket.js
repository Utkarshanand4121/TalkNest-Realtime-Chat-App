import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
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
    delete userSoketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSoketMap));
  });
});

export { io, app, server };
