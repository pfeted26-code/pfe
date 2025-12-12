import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/announcement`;

// Create announcement (admin only)
export async function createAnnouncement(announcementData) {
  try {
    const response = await axios.post(API_URL, announcementData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get all announcements (admin)
export async function getAllAnnouncements(includeExpired = false, includeInactive = false) {
  try {
    const response = await axios.get(`${API_URL}?includeExpired=${includeExpired}&includeInactive=${includeInactive}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get my announcements (all users)
export async function getMyAnnouncements() {
  try {
    const response = await axios.get(`${API_URL}/my-announcements`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get announcement by ID
export async function getAnnouncementById(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Update announcement (admin)
export async function updateAnnouncement(id, announcementData) {
  try {
    const response = await axios.put(`${API_URL}/${id}`, announcementData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Delete announcement (admin)
export async function deleteAnnouncement(id) {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Mark announcement as viewed
export async function markAnnouncementAsViewed(id) {
  try {
    const response = await axios.post(`${API_URL}/${id}/view`, {}, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Toggle pin announcement (admin)
export async function togglePinAnnouncement(id) {
  try {
    const response = await axios.patch(`${API_URL}/${id}/toggle-pin`, {}, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Get announcement stats (admin)
export async function getAnnouncementStats(id) {
  try {
    const response = await axios.get(`${API_URL}/${id}/stats`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
