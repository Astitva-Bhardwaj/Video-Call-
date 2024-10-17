import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/create-meeting">Create Meeting</Link>
        <Link to="/join-meeting">Join Meeting</Link>
      </nav>
    </header>
  );
};

export default Header;
