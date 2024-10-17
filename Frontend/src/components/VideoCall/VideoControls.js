// VideoControl.js
import React, { useRef } from 'react';

const VideoControl = () => {
  const localStreamRef = useRef(null); // To store the local stream

  const handleToggleVideo = () => {
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled; // Toggle video track
  };

  const handleToggleAudio = () => {
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled; // Toggle audio track
  };

  return (
    <div className="video-controls">
      <button onClick={handleToggleVideo}>Toggle Video</button>
      <button onClick={handleToggleAudio}>Toggle Audio</button>
    </div>
  );
};

export default VideoControl;
