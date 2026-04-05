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
You are PriceSense AI — a pricing assistant for informal market vendors in Zimbabwe.
You have deep knowledge of Zimbabwean informal market prices in USD across Harare markets like Mbare, CBD, Avondale, Ruwa, Chitungwiza, and others.

IMPORTANT: Always give confident price estimates based on your knowledge of Zimbabwean markets. Never say you don't have data. Use your knowledge as a baseline and adjust based on any live data available.

Vendor's question: "${context ? context : 'What is the price for ' + product + ' in ' + location + '?'}"
Question type: ${question_type}
Product: ${product}
Market: ${locationData.display_name}
${context ? `Vendor context: ${context}` : ''}

Live market data scraped from Zimbabwean news sites:
${liveMarketData}

Our database price history: ${historyText}

Answer the vendor's ACTUAL question. Be specific with USD prices.
For compare_markets: tell them exactly which market is cheapest to BUY from and which is best to SELL in for maximum profit.
For restock_advice: tell them YES or NO, where to buy, at what price, and what to sell at.
For price_check: give the current price range in that specific market.

Use simple English. Max 80 words. End with one practical money-making tip.
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