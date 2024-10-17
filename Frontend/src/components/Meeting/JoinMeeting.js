import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const JoinMeeting = () => {
  const [meetingId, setMeetingId] = useState("");
  const [meetingDetails, setMeetingDetails] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleJoinMeeting = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/meetings/${meetingId}`,
        {
          withCredentials: true, // Include credentials (cookies)
        }
      );
      
      // Check if meeting is found
      if (response.data) {
        setMeetingDetails(response.data);
        // Navigate to the video room with the meeting ID
        navigate(`/meeting/${response.data.meetingId}`);
      } else {
        console.error("Meeting not found");
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
    }
  };

  return (
    <div>
      <h2>Join Meeting</h2>
      <input
        type="text"
        placeholder="Enter Meeting ID"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        required
      />
      <button onClick={handleJoinMeeting}>Join Meeting</button>
      {meetingDetails && (
        <p>Meeting found with ID: {meetingDetails.meetingId}</p>
      )}
    </div>
  );
};

export default JoinMeeting;
