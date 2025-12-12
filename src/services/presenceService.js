import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/presence`;

// Create presence
export async function createPresence(presenceData) {
  const response = await axios.post(`${API_URL}/create`, presenceData, {
    withCredentials: true,
  });
  return response.data;
}

// Get all presence - FIXED: matches the route '/getAll'
export async function getAllPresence() {
  const response = await axios.get(`${API_URL}/getAll`, {
    withCredentials: true,
  });
  return response.data;
}

// Get presence by ID - FIXED: matches the route '/getById/:id'
export async function getPresenceById(id) {
  const response = await axios.get(`${API_URL}/getById/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get presence by etudiant
export async function getPresenceByEtudiant(etudiantId) {
  const response = await axios.get(`${API_URL}/getByEtudiant/${etudiantId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get presence by seance
export async function getPresenceBySeance(seanceId) {
  const response = await axios.get(`${API_URL}/getBySeance/${seanceId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get taux presence par seance
export async function getTauxPresenceParSeance(seanceId) {
  const response = await axios.get(`${API_URL}/taux/seance/${seanceId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get taux presence for etudiant (all seances)
export async function getTauxPresenceEtudiant(etudiantId) {
  const response = await axios.get(`${API_URL}/taux/etudiant/${etudiantId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Get taux presence for etudiant in specific seance
export async function getTauxPresenceEtudiantSeance(etudiantId, seanceId) {
  const response = await axios.get(`${API_URL}/taux/etudiant/${etudiantId}/seance/${seanceId}`, {
    withCredentials: true,
  });
  return response.data;
}

// Delete presence by ID - FIXED: matches the route '/delete/:id'
export async function deletePresenceById(id) {
  const response = await axios.delete(`${API_URL}/delete/${id}`, {
    withCredentials: true,
  });
  return response.data;
}

// Delete all presence - FIXED: matches the route '/deleteAll'
export async function deleteAllPresence() {
  const response = await axios.delete(`${API_URL}/deleteAll`, {
    withCredentials: true,
  });
  return response.data;
}

// Update presence
export async function updatePresence(id, presenceData) {
  const response = await axios.put(`${API_URL}/update/${id}`, presenceData, {
    withCredentials: true,
  });
  return response.data;
}