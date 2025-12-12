import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/notification`; // ⚠️ Changez selon votre route backend

// Create notification
export async function createNotification(notificationData) {
  try {
    const response = await axios.post(API_URL, notificationData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error; // Renvoie l'erreur complète pour déboguer
  }
}

// Get all notifications (admin only)
export async function getAllNotifications() {
  try {
    const response = await axios.get(API_URL, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get notifications by user
export async function getNotificationsByUser(userId) {
  try {
    const response = await axios.get(`${API_URL}/user/${userId}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const response = await axios.put(`${API_URL}/${notificationId}/read`, {}, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Delete single notification
export async function deleteNotification(notificationId) {
  try {
    const response = await axios.delete(`${API_URL}/${notificationId}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Delete all notifications of a user
export async function deleteAllNotificationsOfUser(userId) {
  try {
    const response = await axios.delete(`${API_URL}/user/${userId}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
