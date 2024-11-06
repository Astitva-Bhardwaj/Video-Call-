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

// Connect to MongoDB
connectDB();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

// Store active rooms and their participants
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on('get-user-info', async (userId) => {
    try {
      // Query your database for user info
      const user = await db.users.findById(userId);
      
      // Emit user info back to all clients in the room
      io.to(socket.roomId).emit('user-info', {
        userId: userId,
        userName: user.name 
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  });

  // Join room handler
  socket.on("join-room", (roomId) => {
    console.log(`User ${socket.id} joining room ${roomId}`);
    
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    
    // Get existing users
    const existingUsers = Array.from(rooms.get(roomId));
    
    // Add new user to room
    rooms.get(roomId).add(socket.id);
    
    // Notify existing users about the new user
    existingUsers.forEach(userId => {
      io.to(userId).emit("user-joined", socket.id);
    });

    // Handle WebRTC signaling
    socket.on("offer", ({ userId, offer }) => {
      console.log(`Forwarding offer from ${socket.id} to ${userId}`);
      io.to(userId).emit("offer", {
        userId: socket.id,
        offer: offer
      });
    });

    socket.on("answer", ({ userId, answer }) => {
      console.log(`Forwarding answer from ${socket.id} to ${userId}`);
      io.to(userId).emit("answer", {
        userId: socket.id,
        answer: answer
      });
    });

    socket.on("ice-candidate", ({ userId, candidate }) => {
      console.log(`Forwarding ICE candidate from ${socket.id} to ${userId}`);
      io.to(userId).emit("ice-candidate", {
        userId: socket.id,
        candidate: candidate
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User ${socket.id} disconnected from room ${roomId}`);
      if (rooms.has(roomId)) {
        rooms.get(roomId).delete(socket.id);
        if (rooms.get(roomId).size === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("user-left", socket.id);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});