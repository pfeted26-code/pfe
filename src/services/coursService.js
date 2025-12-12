import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Get all cours
export async function getAllCours() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cours/getAllCours`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch all cours: " + error.message);
  }
}

// Get cours by ID
export async function getCoursById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/cours/getCoursById/${id}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch cours with id " + id + ": " + error.message);
  }
}

// Create cours
export async function createCours(coursData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/cours/createCours`, coursData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to create cours: " + error.message);
  }
}

// Update cours
export async function updateCours(id, coursData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/cours/updateCours/${id}`, coursData, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to update cours with id " + id + ": " + error.message);
  }
}

// Delete cours by ID
export async function deleteCoursById(id) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cours/deleteCours/${id}`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete cours with id " + id + ": " + error.message);
  }
}

// Delete all cours
export async function deleteAllCours() {
  try {
    const response = await axios.delete(`${API_BASE_URL}/cours/deleteAllCours`, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete all cours: " + error.message);
  }
}
