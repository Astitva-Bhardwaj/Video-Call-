import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Layout/header';
import Footer from './components/Layout/footer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard';
import CreateMeeting from './components/Meeting/CreateMeeting';
import JoinMeeting from './components/Meeting/JoinMeeting';
import VideoRoom from './components/VideoCall/VideoRoom';
import './App.css';
import { Box } from '@mui/material';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          {/* Header */}
          <Header />

          {/* Main Content */}
          <Box component="main" sx={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-meeting" element={<CreateMeeting />} />
              <Route path="/join-meeting" element={<JoinMeeting />} />
              <Route path="/meeting/:id" element={<VideoRoom />} />
            </Routes>
          </Box>

          {/* Footer */}
          <Footer />
        </Box>
      </Router>
    </AuthProvider>
  );
}

export default App;
