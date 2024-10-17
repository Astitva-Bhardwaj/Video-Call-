import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Header from './Layout/header';
import Footer from './Layout/footer';
import Login from './Auth/Login';
import Register from '../components/Auth/Register'; 


import CreateMeeting from './Meeting/CreateMeeting';
import JoinMeeting from './Meeting/JoinMeeting';

const Dashboard = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create-meeting" element={<CreateMeeting />} />
        <Route path="/join-meeting" element={<JoinMeeting />} />
        <Route path="/" element={<Login />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default Dashboard;
