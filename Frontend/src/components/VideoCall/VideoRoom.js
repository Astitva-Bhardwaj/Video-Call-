import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const VideoRoom = () => {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const socketRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [error, setError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

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
    if (peerConnectionsRef.current[userId]) {
      console.log('Peer connection already exists for', userId);
      return peerConnectionsRef.current[userId];
    }

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
      const [remoteStream] = event.streams;
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: remoteStream
      }));
    };

    // Log state changes for debugging
    pc.oniceconnectionstatechange = () => {
      console.log(`ICE Connection State with ${userId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        handlePeerDisconnection(userId);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection State with ${userId}:`, pc.connectionState);
    };

    pc.onsignalingstatechange = () => {
      console.log(`Signaling State with ${userId}:`, pc.signalingState);
    };

    peerConnectionsRef.current[userId] = pc;
    return pc;
  };

  const handlePeerDisconnection = (userId) => {
    if (peerConnectionsRef.current[userId]) {
      peerConnectionsRef.current[userId].close();
      delete peerConnectionsRef.current[userId];
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
    }
  };

  // Handle ending the call
  const handleEndCall = () => {
    // Stop all tracks in the local stream
    localStream?.getTracks().forEach(track => track.stop());
    
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    
    // Disconnect socket
    socketRef.current?.disconnect();
    
    // Notify other participants that we're leaving
    socketRef.current?.emit('leave-room', roomId);
    
    // Navigate back to home or another appropriate page
    navigate('/');
  };

  // Handle audio mute/unmute
  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
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
          const pc = createPeerConnection(userId, localStreamCopy);

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
          handlePeerDisconnection(userId);
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
    <>
      <style>
        {`
          .video-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
            background-color: #1f2937;
            border-radius: 0.5rem;
            overflow: hidden;
          }

          .video-element {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .video-label {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
          }

          .video-grid {
            display: grid;
            gap: 1rem;
            grid-template-columns: repeat(1, 1fr);
            max-width: 1200px;
            margin: 0 auto;
            padding: 1rem;
          }

          @media (min-width: 640px) {
            .video-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (min-width: 1024px) {
            .video-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          .control-button {
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            font-weight: 500;
            transition: all 0.2s;
          }

          .control-button:hover {
            opacity: 0.9;
          }
        `}
      </style>

      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Meeting Room: {roomId}
            </h2>
            {error && (
              <div className="bg-red-500 text-white px-4 py-2 rounded-md">
                {error}
              </div>
            )}
          </div>

          {/* Video Grid */}
          <div className="video-grid">
            {/* Local Video */}
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

            {/* Remote Videos */}
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

          {/* Controls */}
          <div className="mt-6 flex justify-center space-x-4">
            <button 
              className="control-button bg-red-500 text-white"
              onClick={handleEndCall}
            >
              End Call
            </button>
            <button 
              className={`control-button ${isAudioMuted ? 'bg-red-500' : 'bg-gray-600'} text-white`}
              onClick={handleToggleAudio}
            >
              {isAudioMuted ? 'Unmute' : 'Mute'}
            </button>
            <button 
              className="control-button bg-gray-600 text-white"
              onClick={() => {/* Add video toggle logic */}}
            >
              Stop Video
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoRoom;