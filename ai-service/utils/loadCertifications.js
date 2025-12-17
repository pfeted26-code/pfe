const fs = require("fs");
const path = require("path");

function loadCertifications() {
  const filePath = path.join(__dirname, "../data/certifications.json");
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

module.exports = { loadCertifications };
