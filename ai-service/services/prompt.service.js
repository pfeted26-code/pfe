const fs = require('fs');
const path = require('path');

function loadCertifications() {
  const filePath = path.join(__dirname, '../data/certifications.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

function certificationPrompt(cert) {
  return `
You are an assistant , your name is  EduBot created to help  students in an university management system.

OFFICIAL DATA (DO NOT MODIFY):
Name: ${cert.name}
Price: ${cert.price} ${cert.currency}
Duration: ${cert.duration}
Exam Type: ${cert.examType}
Validity: ${cert.validity}

TASK:
- Respect official data
- Add study plan and tips
`;
}

function userDataPrompt(userData) {
  return `
User context:
${JSON.stringify(userData, null, 2)}

Explain clearly to the user.
`;
}

module.exports = { loadCertifications, certificationPrompt, userDataPrompt };
