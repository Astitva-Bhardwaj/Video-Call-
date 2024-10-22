import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Box, Button, TextField, Typography, Alert } from "@mui/material";

const JoinMeeting = () => {
  const [meetingId, setMeetingId] = useState("");
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [error, setError] = useState(null); // For error handling
  const [loading, setLoading] = useState(false); // Loading state for UI feedback
  const navigate = useNavigate();

  const handleJoinMeeting = async () => {
    setLoading(true);
    setError(null); // Clear any previous error
    try {
      const response = await axios.get(
        `http://localhost:8000/api/meetings/${meetingId}`,
        {
          withCredentials: true, // Include credentials (cookies)
        }
      );

      if (response.data) {
        setMeetingDetails(response.data);
        // Navigate to the video room with the meeting ID
        setTimeout(() => {
          navigate(`/meeting/${response.data.meetingId}`);
        }, 100); // Add a slight delay to ensure state is updated
      } else {
        setError("Meeting not found. Please check the Meeting ID.");
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      setError("Failed to join the meeting. Please try again.");
    } finally {
      setLoading(false); // Stop loading once the request is done
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
        Join a Meeting
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Enter Meeting ID"
        variant="outlined"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        required
        sx={{ width: "100%", maxWidth: 400, mb: 3 }}
      />

      <Button
        variant="contained"
        color="primary"
        onClick={handleJoinMeeting}
        disabled={loading || !meetingId} // Disable button if loading or no meetingId
        sx={{
          padding: "10px 20px",
          fontSize: "16px",
          textTransform: "none",
          width: "100%",
          maxWidth: 400,
        }}
      >
        {loading ? "Joining..." : "Join Meeting"}
      </Button>

      {meetingDetails && (
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
          Meeting found with ID: {meetingDetails.meetingId}
        </Typography>
      )}
    </Box>
  );
};

export default JoinMeeting;
