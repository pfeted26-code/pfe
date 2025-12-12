import axios from "axios";

// Use VITE_API_BASE_URL, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ============================================
// 📋 CRUD Operations
// ============================================

// Get all classes
export async function getAllClasses() {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getAllClasses`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch all classes: " + (error?.response?.data?.message || error.message));
  }
}

// Get class by ID
export async function getClasseById(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getClasseById/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch class with id ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Create a new class
export async function createClasse(classeData) {
  try {
    const response = await axios.post(`${API_BASE_URL}/classe/createClasse`, classeData, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error("Failed to create class: " + (error?.response?.data?.message || error.message));
  }
}

// Update a class
export async function updateClasse(id, classeData) {
  try {
    const response = await axios.put(`${API_BASE_URL}/classe/updateClasse/${id}`, classeData, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update class with id ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Delete class by ID
export async function deleteClasseById(id) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/classe/deleteClasse/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to delete class with id ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Delete all classes
export async function deleteAllClasses() {
  try {
    const response = await axios.delete(`${API_BASE_URL}/classe/deleteAllClasses`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete all classes: " + (error?.response?.data?.message || error.message));
  }
}

// ============================================
// 📊 Statistics & Information
// ============================================

// Get class statistics
export async function getClasseStats(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getClasseStats/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch class stats with id ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Get all students in a class
export async function getClasseStudents(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getClasseStudents/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch students for class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Get all teachers in a class
export async function getClasseTeachers(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getClasseTeachers/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch teachers for class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Get all courses in a class
export async function getClasseCourses(id) {
  try {
    const response = await axios.get(`${API_BASE_URL}/classe/getClasseCourses/${id}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch courses for class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// ============================================
// 👥 Student Management
// ============================================

// Add students to a class
export async function addStudentsToClasse(id, studentIds) {
  try {
    const response = await axios.post(`${API_BASE_URL}/classe/addStudents/${id}`, { studentIds }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to add students to class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Remove students from a class
export async function removeStudentsFromClasse(id, studentIds) {
  try {
    const response = await axios.post(`${API_BASE_URL}/classe/removeStudents/${id}`, { studentIds }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to remove students from class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// ============================================
// 👨‍🏫 Teacher Management
// ============================================

// Add teachers to a class
export async function addTeachersToClasse(id, teacherIds) {
  try {
    const response = await axios.post(`${API_BASE_URL}/classe/addTeachers/${id}`, { teacherIds }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to add teachers to class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}

// Remove teachers from a class
export async function removeTeachersFromClasse(id, teacherIds) {
  try {
    const response = await axios.post(`${API_BASE_URL}/classe/removeTeachers/${id}`, { teacherIds }, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to remove teachers from class ${id}: ${error?.response?.data?.message || error.message}`);
  }
}
