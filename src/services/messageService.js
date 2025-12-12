import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/message`;

// Get conversation between two users
export async function getConversation(userId1, userId2) {
  return await axios.get(`${API_URL}/conversation/${userId1}/${userId2}`, {
    withCredentials: true,
  });
}

// Get all messages
export async function getAllMessages() {
  return await axios.get(`${API_URL}/all`, {
    withCredentials: true,
  });
}

// Delete message by ID
export async function deleteMessageById(id) {
  return await axios.delete(`${API_URL}/delete/${id}`, {
    withCredentials: true,
  });
}

// Delete all messages
export async function deleteAllMessages() {
  return await axios.delete(`${API_URL}/deleteAll`, {
    withCredentials: true,
  });
}
