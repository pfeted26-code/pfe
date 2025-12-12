import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/examen`;

/* ====================== EXAM SERVICES ====================== */

/** Create a new exam */
export async function createExamen(examData) {
  return await axios.post(`${API_URL}/create`, examData, {
    withCredentials: true,
  });
}

/** Get all exams (filtered by user role on backend) */
export async function getAllExamen() {
  return await axios.get(`${API_URL}/getAll`, { withCredentials: true });
}

/** Get exam by ID */
export async function getExamenById(id) {
  return await axios.get(`${API_URL}/getById/${id}`, { withCredentials: true });
}

/** Update exam by ID */
export async function updateExamen(id, examData) {
  return await axios.put(`${API_URL}/update/${id}`, examData, { withCredentials: true });
}

/** Delete exam by ID */
export async function deleteExamenById(id) {
  return await axios.delete(`${API_URL}/delete/${id}`, { withCredentials: true });
}

/** Submit an assignment (upload file) */
export async function submitAssignment(examenId, file) {
  if (!file) throw new Error("Fichier requis");

  const formData = new FormData();
  formData.append("file", file);

  return await axios.post(`${API_URL}/submitAssignment/${examenId}`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/** Replace/update an existing assignment submission (upload new file) */
export async function updateSubmission(examenId, file) {
  if (!file) throw new Error("Fichier requis");

  const formData = new FormData();
  formData.append("file", file);

  return await axios.put(`${API_URL}/updateSubmission/${examenId}`, formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

/** Delete a student's submission for an assignment */
export async function deleteSubmission(examenId) {
  return await axios.delete(`${API_URL}/deleteSubmission/${examenId}`, {
    withCredentials: true,
  });
}

/** Download a single assignment file */
export async function downloadAssignmentFile(examenId, studentId) {
  return await axios.get(`${API_URL}/downloadAssignmentFile/${examenId}/${studentId}`, {
    withCredentials: true,
    responseType: 'blob',
  });
}

/** Download all assignment files for an exam */
export async function downloadAllAssignmentFiles(examenId) {
  return await axios.get(`${API_URL}/downloadAllAssignmentFiles/${examenId}`, {
    withCredentials: true,
    responseType: 'blob',
  });
}

/** Export assignment data */
export async function exportAssignmentData(examenId, format = 'csv') {
  return await axios.get(`${API_URL}/exportAssignmentData/${examenId}?format=${format}`, {
    withCredentials: true,
    responseType: 'blob',
  });
}

/** Get assignment statistics */
export async function getAssignmentStats(examenId) {
  return await axios.get(`${API_URL}/getAssignmentStats/${examenId}`, {
    withCredentials: true,
  });
}
