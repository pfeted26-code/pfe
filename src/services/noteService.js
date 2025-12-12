import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/note`;

/* ===============================
   GET ALL NOTES
================================ */
export async function getAllNotes() {
  return axios.get(`${API_URL}/get`, {
    withCredentials: true,
  });
}

/* ===============================
   GET NOTE BY ID
================================ */
export async function getNoteById(id) {
  return axios.get(`${API_URL}/getById/${id}`, {
    withCredentials: true,
  });
}

/* ===============================
   CREATE NOTE
================================ */
export async function createNote(noteData) {
  return axios.post(`${API_URL}/create`, noteData, {
    withCredentials: true,
  });
}

/* ===============================
   UPDATE NOTE
================================ */
export async function updateNoteById(id, data) {
  return axios.put(`${API_URL}/updateById/${id}`, data, {
    withCredentials: true,
  });
}

/* ===============================
   DELETE NOTE BY ID
================================ */
export async function deleteNoteById(id) {
  return axios.delete(`${API_URL}/delete/${id}`, {
    withCredentials: true,
  });
}

//get note by examen and etudiant
export async function getNoteByExamenAndEtudiant(examenId, etudiantId) {
  // Backend route is /note/getByExamenEtudiant/:examenId/:etudiantId
  return axios.get(`${API_URL}/getByExamenEtudiant/${examenId}/${etudiantId}`, {
    withCredentials: true,
  });
}

/* ===============================
   GET NOTES FOR STUDENT
================================ */
export async function getNotesForStudent() {
  return axios.get(`${API_URL}/getForStudent`, {
    withCredentials: true,
  });
}
