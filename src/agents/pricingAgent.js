const { askGemini } = require('../services/gemini');
const { enrichLocation } = require('../services/location');
const { scrapeMarketData } = require('../services/scraper');
const pool = require('../db');

async function getPriceRecommendation(product, location, phone) {
  const [locationData, liveMarketData, { rows: history }] = await Promise.all([
    enrichLocation(location),
    scrapeMarketData(product),
    pool.query(
      `SELECT price, recorded_at FROM market_prices
       WHERE product ILIKE $1 ORDER BY recorded_at DESC LIMIT 5`,
      [product]
    )
  ]);

  const historyText = history.length > 0
    ? history.map(r => `$${r.price} on ${new Date(r.recorded_at).toDateString()}`).join(', ')
    : 'No history yet';

  const prompt = `
You are PriceSense AI — a pricing assistant for informal market vendors in Zimbabwe.
Reply in clear, simple English that informal market vendors in Zimbabwe can easily understand.
Be brief, warm, and practical. Maximum 80 words.

Product: ${product}
Market: ${locationData.display_name}
Price history from our database: ${historyText}

Live market intelligence scraped from Zimbabwean news and market sites:
${liveMarketData}

Based on ALL of the above, tell the vendor:
1. Suggested selling price range in USD
2. Restock now? Yes/No and one sentence why
3. One practical tip for selling this product today

Use phrases like "Saka...", "Zvino...", "Handei..." naturally mixed with English.
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