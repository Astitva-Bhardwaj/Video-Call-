import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie"; // Import js-cookie
import { useNavigate } from "react-router-dom"; // Import useNavigate

const CreateMeeting = () => {
  const [meetingId, setMeetingId] = useState("");
  const navigate = useNavigate(); // Initialize useNavigate

  // Retrieve token from cookies
  const token = Cookies.get("token"); // Change 'token' to the name you used to store it in cookies
  console.log("Token:", token); // Log token to ensure it's retrieved

  const handleCreateMeeting = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/meetings",
        {},
        {
          withCredentials: true, // Include credentials (cookies)
        }
      );
      console.log("Create Meeting Response:", response.data);
      setMeetingId(response.data.meetingId);
      // Delay navigation slightly to ensure state updates
      setTimeout(() => {
        navigate(`/meeting/${response.data.meetingId}`);
      }, 100); // 100 ms delay
    } catch (error) {
      console.error("Error creating meeting:", error);
    }
  };

  return (
    <div>
      <h2>Create Meeting</h2>
      <button onClick={handleCreateMeeting}>Create Meeting</button>
      {meetingId && <p>Meeting ID: {meetingId}</p>}
    </div>
  );
};

export default CreateMeeting;
