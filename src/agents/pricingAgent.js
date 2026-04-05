const { askGemini } = require('../services/gemini');
const { enrichLocation } = require('../services/location');
const { scrapeMarketData } = require('../services/scraper');
const pool = require('../db');

async function getPriceRecommendation(parsed, phone) {
  const { product, location, question_type, context } = parsed;

  const [locationData, liveMarketData, { rows: history }] = await Promise.all([
    enrichLocation(location),
    scrapeMarketData(product),
    pool.query(
      `SELECT price, location, recorded_at FROM market_prices
       WHERE product ILIKE $1 ORDER BY recorded_at DESC LIMIT 10`,
      [product]
    )
  ]);

  const historyText = history.length > 0
    ? history.map(r => `$${r.price} at ${r.location} on ${new Date(r.recorded_at).toDateString()}`).join(', ')
    : 'No price history yet';

  const prompt = `
You are PriceSense AI — a smart pricing assistant for informal market vendors in Zimbabwe.
Answer the vendor's ACTUAL question directly and practically.
Use simple English. Maximum 80 words. No bullet point numbers — use short paragraphs.

Vendor's question: "${context ? context : 'What is the price for ' + product + ' in ' + location + '?'}"
Question type: ${question_type}
Product: ${product}
Market they asked about: ${locationData.display_name}
${context ? `Extra context from vendor: ${context}` : ''}

Our price history across markets: ${historyText}

Live market data from Zimbabwean news and market sites:
${liveMarketData}

Instructions based on question type:
- price_check: Tell them the current price range for that product in that specific market
- restock_advice: Tell them whether to restock, where to buy cheapest, and at what price to sell
- compare_markets: Compare prices across markets and tell them where is cheapest to buy and where to sell for most profit
- general: Answer their specific question directly using all available data

Always end with one practical tip. Be direct — vendors need fast, useful answers.
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