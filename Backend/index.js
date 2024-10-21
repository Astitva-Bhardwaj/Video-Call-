const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 8000;

// Connect to MongoDB
connectDB();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// WebSocket logic
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    
    const room = io.sockets.adapter.rooms.get(roomId) || { size: 0 };
    const numClients = room.size;

    if (rooms.has(socket.id)) {
      console.log(`User ${socket.id} already in room ${rooms.get(socket.id)}`);
      return;
    }

    // These events are sent back only to the caller
    if (numClients === 0) {
      socket.join(roomId);
      socket.emit('room-created');
      console.log(`Room ${roomId} created by user ${socket.id}`);
    } else if (numClients >=1 ) {
      socket.join(roomId);
      socket.emit('room-joined');
      socket.to(roomId).emit('start-call');
      console.log(`User ${socket.id} joined room ${roomId}. Starting call.`);
    } else {
      socket.emit('room-full');
      console.log(`User ${socket.id} attempted to join full room ${roomId}`);
      return;
    }

    rooms.set(socket.id, roomId);

    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected from room ${roomId}`);
      socket.to(roomId).emit("user-disconnected", socket.id);
      rooms.delete(socket.id);
    });
  });

  socket.on("offer", (offer, roomId) => {
    console.log(`Offer received from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer, roomId) => {
    console.log(`Answer received from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate, roomId) => {
    console.log(`ICE candidate received from ${socket.id} in room ${roomId}`);
    socket.to(roomId).emit("ice-candidate", candidate);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});