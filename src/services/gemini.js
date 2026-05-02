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
- "Mapotatoes arikuita mari kuBudiriro" = How much are potatoes in  Budiriro
- "Matamato arikuita mari" = how much are tomatoes

Transcribe EXACTLY what is said, preserving Shona words as-is. Return only the words.` }
  ]);
  return result.response.text();
}

async function analyzeProductImage(imageBase64, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const result = await model.generateContent([
    { inlineData: { data: imageBase64, mimeType } },
    { text: `You are a Zimbabwean market price analyst.
Look at this image and identify:
1. What produce or groceries are visible
2. Any prices written on boards, tags or signs
3. Estimated quantity or unit (per kg, per bucket, per crate)

Respond in this format:
"I can see [product] selling for [price] per [unit]"

If multiple products are visible, list each one.
If no prices are visible, just list the products you see.
If this is not a market or food image, say "I can only analyse market produce images."` }
  ]);
  return result.response.text();
}
module.exports = { askGemini, transcribeAudio };