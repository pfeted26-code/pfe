import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/seance`;

// Create seance
export async function createSeance(seanceData) {
  const response = await axios.post(`${API_URL}/createSeance`, seanceData, {
    withCredentials: true,
  });
  return response.data;
}

// Get all seances (filtered by role on backend)
export async function getAllSeances() {
  const response = await axios.get(`${API_URL}/getAllSeances`, {
    withCredentials: true,
  });
  return response.data;
}

// Get seance by ID
export async function getSeanceById(id) {
  const response = await axios.get(`${API_URL}/getSeanceById/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get seances by teacher
export async function getSeancesByEnseignant(enseignantId) {
  const response = await axios.get(`${API_URL}/getByEnseignant/${enseignantId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get seances by class
export async function getSeancesByClasse(classeId) {
  const response = await axios.get(`${API_URL}/getByClasse/${classeId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Update seance
export async function updateSeance(id, seanceData) {
  const response = await axios.put(`${API_URL}/updateSeance/${id}`, seanceData, {
    withCredentials: true,
  });
  return response.data;
}

// Delete seance
export async function deleteSeance(id) {
  const response = await axios.delete(`${API_URL}/deleteSeance/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

// Delete all seances
export async function deleteAllSeances() {
  const response = await axios.delete(`${API_URL}/deleteAllSeances`, {
    withCredentials: true,
  });
  return response.data;
}