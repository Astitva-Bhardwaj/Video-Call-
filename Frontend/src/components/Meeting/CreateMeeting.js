import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, CircularProgress, Alert } from "@mui/material"; // Material-UI components

const CreateMeeting = () => {
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false); // To show loading spinner
  const [error, setError] = useState(null); // For handling errors
  const navigate = useNavigate();

  // Retrieve token from cookies
  const token = Cookies.get("token");
  console.log("Token:", token);

  const handleCreateMeeting = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:8000/api/meetings",
        {},
        {
          withCredentials: true,
        }
      );
      console.log("Create Meeting Response:", response.data);
      setMeetingId(response.data.meetingId);
      setTimeout(() => {
        navigate(`/meeting/${response.data.meetingId}`);
      }, 100);
    } catch (error) {
      console.error("Error creating meeting:", error);
      setError("Failed to create a meeting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 3,
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom>
        Create a New Meeting
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateMeeting}
        disabled={loading}
        sx={{
          padding: "10px 20px",
          borderRadius: "8px",
          fontSize: "16px",
          textTransform: "none",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Create Meeting"
        )}
      </Button>

      {meetingId && (
        <Typography
          variant="body1"
          sx={{
            marginTop: 2,
            padding: "10px 15px",
            backgroundColor: "#e0f7fa",
            borderRadius: "8px",
            color: "#00796b",
          }}
        >
          Meeting ID: {meetingId}
        </Typography>
      )}
    </Box>
  );
};

export default CreateMeeting;
