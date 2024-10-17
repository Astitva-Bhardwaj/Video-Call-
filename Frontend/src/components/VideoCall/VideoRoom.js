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

        socketRef.current.emit('join-room', roomId, socketRef.current.id);

        socketRef.current.on('user-connected', (userId) => {
          console.log('User connected:', userId);
          handleUserConnected(userId);
        });

        socketRef.current.on('offer', handleReceiveOffer);
        socketRef.current.on('answer', handleReceiveAnswer);
        socketRef.current.on('ice-candidate', handleNewICECandidate);
      } catch (error) {
        console.error('Error setting up call:', error);
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

  const handleUserConnected = async (userId) => {
    console.log('Creating offer for user:', userId);
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    socketRef.current.emit('offer', offer, roomId);
  };

  const handleReceiveOffer = async (offer, userId) => {
    console.log('Received offer from user:', userId);
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socketRef.current.emit('answer', answer, roomId);
  };

  const handleReceiveAnswer = async (answer, userId) => {
    console.log('Received answer from user:', userId);
    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const handleNewICECandidate = async (candidate, userId) => {
    try {
      console.log('Received ICE candidate from user:', userId);
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  };

  return (
    <div className="video-room">
      <h2>Meeting ID: {roomId}</h2>
      <div className="video-container">
        <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px', height: '200px' }} />
        <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px', height: '200px' }} />
      </div>
    </div>
  );
};

export default VideoRoom;