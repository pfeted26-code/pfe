import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/users`;

// ------------------- CREATE USERS -------------------
export const createUser = async (userData) => {
  // Determine endpoint based on role (must match Express routes EXACTLY)
  let endpoint = `${API_URL}/create-etudiant`; // default
  if (userData.role === "admin") endpoint = `${API_URL}/create-admin`;
  if (userData.role === "enseignant") endpoint = `${API_URL}/create-enseignant`;

  const formData = new FormData();

  Object.keys(userData).forEach((key) => {
    if (Array.isArray(userData[key])) {
      userData[key].forEach((item) => formData.append(key, item));
    } else {
      formData.append(key, userData[key]);
    }
  });

  const res = await fetch(endpoint, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error" }));
    throw new Error(error.message || "Failed to create user");
  }

  return res.json();
};

// ------------------- GET USERS -------------------

export const getAllUsers = () =>
  axios.get(`${API_URL}/getAllUsers`, { withCredentials: true }).then(res => res.data);

export const getAdmins = () =>
  axios.get(`${API_URL}/admins`, { withCredentials: true }).then(res => res.data);

export const getEnseignants = () =>
  axios.get(`${API_URL}/enseignants`, { withCredentials: true }).then(res => res.data);

export const getEtudiants = () =>
  axios.get(`${API_URL}/etudiants`, { withCredentials: true }).then(res => res.data);

export const getUserById = (id) =>
  axios.get(`${API_URL}/getUserById/${id}`, { withCredentials: true }).then(res => res.data);

export const getUserAuth = () =>
  axios.get(`${API_URL}/me`, { withCredentials: true }).then(res => res.data);

// ------------------- UPDATE USERS -------------------

export const updateUserById = async (id, userData) => {
  const endpoint = `${API_URL}/update/${id}`;

  const formData = new FormData();
  Object.keys(userData).forEach((key) => {
    if (Array.isArray(userData[key])) {
      userData[key].forEach((item) => formData.append(key, item));
    } else {
      formData.append(key, userData[key]);
    }
  });

  const res = await fetch(endpoint, {
    method: "PUT",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Error" }));
    throw new Error(error.message || "Failed to update user");
  }

  return res.json();
};

export const updatePassword = (id, passwords) =>
  axios.put(`${API_URL}/update-password/${id}`, passwords, {
    withCredentials: true,
  });

// ------------------- DELETE USERS -------------------

export const deleteUserById = (id) =>
  axios.delete(`${API_URL}/delete/${id}`, { withCredentials: true });

export const deleteAllUsers = () =>
  axios.delete(`${API_URL}/deleteAllUsers`, { withCredentials: true });




