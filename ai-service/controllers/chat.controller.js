const { callLLM } = require("../services/ollama.service");
const { BASE_SYSTEM_PROMPT } = require("../prompts/system.prompt");
const { certificationPrompt } = require("../prompts/certification.prompt");
const { userDataPrompt } = require("../prompts/user.prompt");
const { loadCertifications } = require("../utils/loadCertifications");

exports.chat = async (req, res) => {
  try {
    const { message, certificationId, userData } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const messages = [
      { role: "system", content: BASE_SYSTEM_PROMPT }
    ];

    // Check if message is about certifications
    const isCertificationQuery = /certification|cert|AWS|Google|Microsoft|Cisco|Oracle|IBM|CompTIA|Scrum|Project Management|Kubernetes|DevOps|Cybersecurity|Cloud|Data Science|AI|ML|Programming|Networking|Agile|Risk Management/i.test(message);

    if (isCertificationQuery || certificationId) {
      const certs = loadCertifications().certifications;
      let relevantCerts = [];

      if (certificationId) {
        const cert = certs.find(c => c.id === certificationId);
        if (cert) relevantCerts.push(cert);
      } else {
        // Find certifications that match the message
        relevantCerts = certs.filter(cert =>
          message.toLowerCase().includes(cert.name.toLowerCase()) ||
          message.toLowerCase().includes(cert.provider.toLowerCase()) ||
          message.toLowerCase().includes(cert.category.toLowerCase())
        );
      }

      relevantCerts.forEach(cert => {
        messages.push({
          role: "system",
          content: certificationPrompt(cert)
        });
      });
    }

    if (userData) {
      messages.push({
        role: "system",
        content: userDataPrompt(userData)
      });
    }

    messages.push({
      role: "user",
      content: message
    });

    const reply = await callLLM(messages);
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(503).json({ error: "AI service unavailable" });
  }
};
