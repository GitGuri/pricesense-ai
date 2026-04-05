const { askGemini } = require('../services/gemini');

async function parseMessage(text, history = []) {
  const historyText = history.length > 0
    ? history.map(h => `${h.role}: ${h.message}`).join('\n')
    : 'No previous messages';

  const prompt = `
You are extracting structured data from a WhatsApp message sent by a market vendor in Zimbabwe.

Conversation history:
${historyText}

Latest message: "${text}"

Using the conversation history for context, extract and return ONLY a valid JSON object:
- product: the main product being discussed (use history if not mentioned in latest message)
- location: the market location they want prices FOR (use history if not mentioned, default "Harare")
- question_type: one of "price_check", "restock_advice", "compare_markets", "general"
- context: full context of what the vendor wants to know including history

Return ONLY the JSON. No explanation. No markdown. Never return null for product — use history context.
  `;

  try {
    const raw = await askGemini(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      product: parsed.product || 'general',
      location: parsed.location || 'Harare',
      question_type: parsed.question_type || 'general',
      context: parsed.context || text
    };
  } catch (err) {
    console.error('Parser error:', err.message);
    return {
      product: 'general',
      location: 'Harare',
      question_type: 'general',
      context: text
    };
  }
}

module.exports = { parseMessage };