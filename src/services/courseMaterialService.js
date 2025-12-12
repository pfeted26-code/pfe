import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/course-material`;

// ------------------------
// Upload material
// ------------------------
export async function uploadMaterial(coursId, formData) {
  try {
    const response = await axios.post(
      `${API_URL}/upload/${coursId}`,
      formData,
      { 
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" } 
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ------------------------
// Get all materials of a course
// ------------------------
export async function getMaterialsByCourse(coursId) {
  try {
    const response = await axios.get(`${API_URL}/course/${coursId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ------------------------
// Get a single material
// ------------------------
export async function getMaterialById(materialId) {
  try {
    const response = await axios.get(`${API_URL}/getMaterial/${materialId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// ------------------------
// Delete material
// ------------------------
export async function deleteMaterial(materialId) {
  try {
    const response = await axios.delete(`${API_URL}/deleteMaterial/${materialId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
