function userDataPrompt(userData) {
  return `
USER CONTEXT:
${JSON.stringify(userData, null, 2)}

Explain clearly and adapt the answer to the user.
`;
}

module.exports = { userDataPrompt };
