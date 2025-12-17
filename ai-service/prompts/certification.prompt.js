function certificationPrompt(cert) {
  return `
OFFICIAL CERTIFICATION DATA (DO NOT MODIFY):

Name: ${cert.name}
Provider: ${cert.provider}
Category: ${cert.category}
Level: ${cert.level}
Date Earned: ${cert.dateEarned}
Expiry Date: ${cert.expiryDate}
Credential ID: ${cert.credentialId}
Status: ${cert.status}
Price: ${cert.price} ${cert.currency}
Duration: ${cert.duration}
Exam Type: ${cert.examType}
Validity: ${cert.validity}
Exam Questions: ${cert.exam.questions}
Exam Time: ${cert.exam.time}
Passing Score: ${cert.exam.passingScore}

TASK:
- Respect official data strictly for the details provided
- Explain the certification clearly using the data
- Add a realistic study plan
- Give practical exam tips
- For any details not in the official data, you may supplement with your knowledge
`;
}

module.exports = { certificationPrompt };
