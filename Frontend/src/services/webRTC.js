import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client'; // Import socket.io client

const WebRTC = ({ roomId }) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  
  // Initialize socket connection
  const socket = useRef(null);

  useEffect(() => {
    // Set up socket.io client connection
    socket.current = io('http://localhost:8000'); // Backend URL
    socket.current.emit('join-room', roomId); // Join the room with roomId

    // Initialize the local media stream
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

    // Set up WebRTC peer connection
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnectionRef.current = peerConnection;

    // Listen for remote stream
    peerConnection.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Add local stream tracks to the peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the candidate to the remote peer
        socket.current.emit('ice-candidate', event.candidate, roomId);
      }
    };

    // Listen for ICE candidates from the remote peer
    socket.current.on('ice-candidate', (candidate) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });

    // Listen for WebRTC offer
    socket.current.on('offer', async (offer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.current.emit('answer', answer, roomId); // Send answer to the remote peer
    });

    // Listen for WebRTC answer
    socket.current.on('answer', async (answer) => {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });

    return () => {
      // Cleanup on component unmount
      peerConnection.close();
      socket.current.disconnect();
    };
  }, [localStream, roomId]);

  const startCall = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    // Send offer to remote peer
    socket.current.emit('offer', offer, roomId);
  };

  return (
    <div>
      <h2>WebRTC Video Call</h2>
      <video ref={localVideoRef} autoPlay muted style={{ width: '300px', height: '200px' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '300px', height: '200px' }} />
      <button onClick={startCall}>Start Call</button>
    </div>
  );
};

export default WebRTC;
