import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/users`; // Your auth endpoints are under /users

// Login
export async function login(email, password) {
  return await axios.post(`${API_URL}/login`, {
    email,
    password
  }, {
    withCredentials: true,
  });
}

// Logout
export async function logout() {
  try {
    const response = await axios.post(`${API_URL}/logout`, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Logout failed:', err.response?.data || err.message);
    throw err;
  }
}


// Get authenticated user
export async function getUserAuth() {
  return await axios.get(`${API_URL}/getUserAuth`, {
    withCredentials: true,
  });
}