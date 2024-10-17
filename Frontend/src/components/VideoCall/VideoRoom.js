import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import VideoControl from './VideoControls'; // Ensure this path is correct
import io from 'socket.io-client';

const socket = io('http://localhost:3000'); // Your signaling server URL

const VideoRoom = () => {
  const { id } = useParams(); // Get the meeting ID from the URL parameters
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  // Initialize the local video stream and peer connection
  useEffect(() => {
    const initLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    };

    initLocalStream();

    // Create Peer Connection
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    // Add local stream tracks to the peer connection
    localStream && localStream.getTracks().forEach(track => {
      peerConnectionRef.current.addTrack(track, localStream);
    });

    // Listen for remote stream
    peerConnectionRef.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream; // Update remote video element
      }
    };

    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('New ICE candidate:', event.candidate);
        socket.emit('ice-candidate', event.candidate); // Emit the candidate
      }
    };

    // Socket.io signaling
    socket.on('offer', (offer) => {
      joinCall(offer); // Call joinCall when an offer is received
    });

    socket.on('answer', (answer) => {
      peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', (candidate) => {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      // Cleanup on component unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close(); // Close the peer connection
        peerConnectionRef.current = null;  // Prevent memory leaks
      }
      socket.disconnect(); // Cleanup socket on unmount
    };
  }, [localStream]); // Add localStream as a dependency to update connection when available

  // Start call function to create an offer
  const startCall = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socket.emit('offer', offer); // Send the offer via signaling
  };

  // Join call function to handle incoming offer
  const joinCall = async (offer) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socket.emit('answer', answer); // Send the answer via signaling
  };

  return (
    <div className="video-room">
      <h2>Meeting ID: {id}</h2>
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', height: '200px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', height: '200px' }} />
      </div>
      <VideoControl />
      <button onClick={startCall}>Start Call</button>
      {/* The joinCall button might be removed or replaced with a different functionality */}
    </div>
  );
};

export default VideoRoom;
