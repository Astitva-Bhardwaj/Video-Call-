import React, { createContext, useState } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/auth/login",
        { username, password },
        {
          withCredentials: true, // Include credentials (cookies)
        }
      );

      console.log("Login response:", response.data);
      setToken(response.data.token);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
