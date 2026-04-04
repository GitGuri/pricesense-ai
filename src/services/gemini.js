const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function transcribeAudio(audioBase64, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent([
    { inlineData: { data: audioBase64, mimeType } },
    { text: 'Transcribe this audio. Return only the spoken words, nothing else.' }
  ]);
  return result.response.text();
}

module.exports = { askGemini, transcribeAudio };