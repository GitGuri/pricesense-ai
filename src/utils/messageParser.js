const { askGemini } = require('../services/gemini');

async function parseMessage(text) {
  const prompt = `
You are extracting structured data from a WhatsApp message sent by a market vendor in Zimbabwe.

Message: "${text}"

Extract and return ONLY a valid JSON object with these fields:
- product: the main product being asked about (e.g. "potatoes", "tomatoes", "eggs")
- location: the market location they want prices FOR (e.g. "Mbare", "CBD", "Ruwa"). If none mentioned use "Harare"
- question_type: one of "price_check", "restock_advice", "compare_markets", "general"
- context: any extra info the vendor gave (e.g. "buying at $5 per kg in Ruwa") or null

Return ONLY the JSON. No explanation. No markdown.
  `;

  try {
    const raw = await askGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Parser error:', err.message);
    return {
      product: text.split(' ')[0] || 'unknown',
      location: 'Harare',
      question_type: 'general',
      context: null
    };
  }
}

module.exports = { parseMessage };