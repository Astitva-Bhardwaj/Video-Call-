import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";


const VideoRoom = () => {
  const { id } = useParams();
  const meeting = async (element) => {
    // Ensure usern

    const appID = 946219318;
    const serverSecret = "8e0b853d79deae0bcbfe949b73ca46a4";
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      id,
      Date.now().toString(),
      "Enter Name here" // Use the fetched username here
    );
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.GroupCall,
      },
    });
  };

  // Handle loading and error states`

  return <div ref={meeting} style={{ width: "100vw", height: "100vh" }}></div>;
};

export default VideoRoom;