const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function transcribeAudio(audioBase64, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const result = await model.generateContent([
    { inlineData: { data: audioBase64, mimeType } },
    { text: `You are transcribing audio from a Zimbabwean market vendor. 
They speak mixed Shona-English (Shonglish). 

Shona grammar rules:
- "ari" = "are/is" (present tense prefix)
- "ari kuita" = "are doing/making" 
- "mari" = "money/price"
- "ku" prefix = location (kuBudiriro = at Budiriro)
- "Ma" prefix = plural (mapotatoes = potatoes)

Example phrases:
- "Mapotatoes arikuita mari kuBudiriro" = potatoes are expensive at Budiriro
- "Matamato arikuita sei" = how much are tomatoes

Transcribe EXACTLY what is said, preserving Shona words as-is. Return only the words.` }
  ]);
  return result.response.text();
}

module.exports = { askGemini, transcribeAudio };