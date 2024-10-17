import React, { useEffect, useRef, useState } from 'react';

const WebRTC = () => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
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
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
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
        console.log('New ICE candidate:', event.candidate);
      }
    };

    return () => {
      // Cleanup on component unmount
      peerConnection.close();
    };
  }, [localStream]);

  const startCall = async () => {
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    // Send offer to remote peer (you should implement signaling to send/receive offers)
    console.log('Offer sent:', offer);
  };

  const joinCall = async (offer) => {
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    // Send answer back to remote peer
    console.log('Answer sent:', answer);
  };

  return (
    <div>
      <h2>WebRTC Video Call</h2>
      <video ref={localVideoRef} autoPlay muted style={{ width: '300px', height: '200px' }} />
      <video ref={remoteVideoRef} autoPlay style={{ width: '300px', height: '200px' }} />
      <button onClick={startCall}>Start Call</button>
      {/* You can add a button for joining a call, which would call joinCall(offer) */}
    </div>
  );
};

export default WebRTC;
