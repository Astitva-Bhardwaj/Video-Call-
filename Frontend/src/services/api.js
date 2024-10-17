import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Base URL for the backend API
});

export default api;
