import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';

const VideoRoom = () => {
  const { id: roomId } = useParams();
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [error, setError] = useState(null);

  // Initialize WebRTC
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Failed to access camera/microphone. Please check permissions.');
      throw err;
    }
  };

  // Create a new peer connection
  const createPeerConnection = (userId, stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local tracks to the peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to', userId);
        socketRef.current.emit('ice-candidate', {
          candidate: event.candidate,
          userId: userId
        });
      }
    };

    // Handle incoming streams
    pc.ontrack = (event) => {
      console.log('Received remote stream from', userId);
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    // Log state changes for debugging
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State with ${userId}:`, pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection State with ${userId}:`, pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling State with ${userId}:`, pc.signalingState);
    };

    return pc;
  };

  useEffect(() => {
    let localStreamCopy = null;

    const init = async () => {
      try {
        // Initialize local stream
        localStreamCopy = await initializeMedia();

        // Initialize socket connection
        socketRef.current = io('http://localhost:8000', {
          withCredentials: true,
        });

        // Join room
        socketRef.current.emit('join-room', roomId);

        // Handle when a new user joins
        socketRef.current.on('user-joined', async (userId) => {
          console.log('New user joined:', userId);
          const pc = createPeerConnection(userId, localStreamCopy);
          peerConnectionsRef.current[userId] = pc;

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            console.log('Sending offer to', userId);
            socketRef.current.emit('offer', {
              userId: userId,
              offer: offer
            });
          } catch (err) {
            console.error('Error creating offer:', err);
          }
        });

        // Handle receiving an offer
        socketRef.current.on('offer', async ({ userId, offer }) => {
          console.log('Received offer from', userId);
          if (!peerConnectionsRef.current[userId]) {
            const pc = createPeerConnection(userId, localStreamCopy);
            peerConnectionsRef.current[userId] = pc;
          }

          const pc = peerConnectionsRef.current[userId];
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current.emit('answer', {
              userId: userId,
              answer: answer
            });
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        });

        // Handle receiving an answer
        socketRef.current.on('answer', async ({ userId, answer }) => {
          console.log('Received answer from', userId);
          const pc = peerConnectionsRef.current[userId];
          if (pc) {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
              console.error('Error handling answer:', err);
            }
          }
        });

        // Handle receiving ICE candidate
        socketRef.current.on('ice-candidate', async ({ userId, candidate }) => {
          console.log('Received ICE candidate from', userId);
          const pc = peerConnectionsRef.current[userId];
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
              console.error('Error adding ICE candidate:', err);
            }
          }
        });

        // Handle user disconnect
        socketRef.current.on('user-left', (userId) => {
          console.log('User left:', userId);
          if (peerConnectionsRef.current[userId]) {
            peerConnectionsRef.current[userId].close();
            delete peerConnectionsRef.current[userId];
          }
          setRemoteStreams(prev => {
            const newStreams = { ...prev };
            delete newStreams[userId];
            return newStreams;
          });
        });

      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to initialize video call');
      }
    };

    init();

    // Cleanup
    return () => {
      localStreamCopy?.getTracks().forEach(track => track.stop());
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      socketRef.current?.disconnect();
    };
  }, [roomId]);

  return (
    <div className="video-room">
      <h2>Meeting Room: {roomId}</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="video-grid">
        <div className="video-container">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="video-element"
          />
          <div className="video-label">You</div>
        </div>
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <div key={userId} className="video-container">
            <video
              autoPlay
              playsInline
              ref={el => {
                if (el) el.srcObject = stream;
              }}
              className="video-element"
            />
            <div className="video-label">User {userId.slice(0, 4)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoRoom;