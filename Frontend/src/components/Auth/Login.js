import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Change here
import { AuthContext } from '../../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('Astitva');
  const [password, setPassword] = useState('Astitva123');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate(); // Change here

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      navigate('/create-meeting'); // Change here
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
