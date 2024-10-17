const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const cookieParser = require("cookie-parser"); // Import cookie-parser

const app = express();
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
app.use(cookieParser()); // Use cookie-parser middleware

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/meetings", meetingRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
