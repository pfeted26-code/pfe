// services/authService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/users`;

/**
 * Request a password reset code
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'envoi du code.");
    }

    return data;
  } catch (error) {
    console.error("Forgot password error:", error);
    throw error;
  }
};

/**
 * Reset the password using code
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.code
 * @param {string} params.newPassword
 * @returns {Promise<Object>}
 */
export const resetPassword = async ({ email, code, newPassword }) => {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de la réinitialisation du mot de passe.");
    }

    return data;
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
};
