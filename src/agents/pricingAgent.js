const { askGemini } = require('../services/gemini');
const { enrichLocation } = require('../services/location');
const pool = require('../db');

async function getPriceRecommendation(product, location, phone) {
  const locationData = await enrichLocation(location);

  const { rows: history } = await pool.query(
    `SELECT price, recorded_at FROM market_prices
     WHERE product ILIKE $1 ORDER BY recorded_at DESC LIMIT 5`,
    [product]
  );

  const historyText = history.length > 0
    ? history.map(r => `$${r.price} on ${new Date(r.recorded_at).toDateString()}`).join(', ')
    : 'No history yet';

  const prompt = `
You are PriceSense AI — a pricing assistant for informal market vendors in Zimbabwe.
Be brief, practical, and friendly. Use simple English.

Product: ${product}
Market: ${locationData.display_name}
Recent price history: ${historyText}

Based on this, respond with:
1. Suggested selling price range in USD
2. Whether to restock now (Yes/No) and why in one sentence
3. One short market tip for this product

Keep the whole reply under 100 words.
  `;

  const response = await askGemini(prompt);

  await pool.query(
    `INSERT INTO price_queries (phone_number, product, location, ai_response)
     VALUES ($1, $2, $3, $4)`,
    [phone, product, location, response]
  );

  return response;
}

module.exports = { getPriceRecommendation };