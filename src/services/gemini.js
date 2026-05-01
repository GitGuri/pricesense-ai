const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function transcribeAudio(audioBase64, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent([
    { inlineData: { data: audioBase64, mimeType } },
    { text: `Transcribe this audio. It is from a Zimbabwean market vendor speaking Shona (ChiShona) or Zimbabwean English. 
They are asking about vegetable and grocery prices at specific market locations in Harare (e.g. Mbare, Budiriro, Ruwa, Chitungwiza, CBD).
Common words they use: tomatoes, potatoes, onions, rice, eggs, sugar, cooking oil, mapotatoes, matamato, anyanisi, mabhora, kuMbare, kuBudiriro, mari, mutengo, kutenga, kutengesa.
Return only the transcribed words, nothing else.` }
  ]);
  return result.response.text();
}

module.exports = { askGemini, transcribeAudio };