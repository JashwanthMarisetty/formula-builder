const axios = require("axios");

async function verifyRecaptcha(token) {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`;

    const response = await axios.post(url);

    return response.data.success; // true or false
  } catch (err) {
    console.error("reCAPTCHA verification failed:", err.message);
    return false;
  }
}

module.exports = verifyRecaptcha;
