import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const VideoRoom = () => {
  const { id: roomId } = useParams();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketRef.current = io('http://localhost:8000', {
      withCredentials: true,
    });

    const initCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        peerConnectionRef.current.ontrack = (event) => {
          console.log('Received remote track');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('Sending ICE candidate');
            socketRef.current.emit('ice-candidate', event.candidate, roomId);
          }
        };

        peerConnectionRef.current.oniceconnectionstatechange = () => {
          console.log(`ICE connection state: ${peerConnectionRef.current.iceConnectionState}`);
        };

        socketRef.current.emit('join-room', roomId);

        socketRef.current.on('user-connected', () => {
          console.log('Another user connected, initiating call');
          handleCallInitiation();
        });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleNewICECandidate);
      } catch (error) {
        console.error('Error setting up call:', error);
        setError('Failed to set up call. Please check your camera and microphone permissions.');
      }
    };

    initCall();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const handleCallInitiation = async () => {
    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      console.log('Sending offer');
      socketRef.current.emit('offer', offer, roomId);
    } catch (error) {
      console.error('Error creating offer:', error);
      setError('Failed to initiate call. Please try again.');
    }
  };

  const handleReceiveOffer = async (offer) => {
    console.log('Received offer');
    
    if (!peerConnectionRef.current) {
      console.error('PeerConnection not initialized');
      return;
    }

    if (peerConnectionRef.current.signalingState !== "stable") {
      console.warn("PeerConnection is not in stable state. Ignoring offer.");
      return;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      if (peerConnectionRef.current.signalingState === "have-remote-offer") {
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        console.log('Sending answer');
        socketRef.current.emit('answer', answer, roomId);
      } else {
        console.warn("Unexpected signaling state after setting remote description:", peerConnectionRef.current.signalingState);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      setError('Failed to process incoming call. Please try reconnecting.');
    }
  };

  const handleReceiveAnswer = async (answer) => {
    console.log('Received answer');
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error setting remote description:', error);
      setError('Failed to establish connection. Please try again.');
    }
  };

  const handleNewICECandidate = async (candidate) => {
    try {
      console.log('Received ICE candidate');
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      // This error is not critical, so we don't set the error state
    }
  };

  return (
    <div className="video-room">
      <h2>Meeting ID: {roomId}</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', height: '200px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', height: '200px' }} />
      </div>
    </div>
  );
};

export default VideoRoom;