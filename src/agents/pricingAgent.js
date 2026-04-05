const { askGemini } = require('../services/gemini');
const { enrichLocation } = require('../services/location');
const { scrapeMarketData } = require('../services/scraper');
const pool = require('../db');

async function getPriceRecommendation(parsed, phone, history = []) {
  const { product, location, question_type, context } = parsed;

  const conversationContext = history.length > 0
    ? `\nConversation so far:\n${history.map(h => `${h.role}: ${h.message}`).join('\n')}`
    : '';

  const [locationData, liveMarketData, { rows: dbHistory }] = await Promise.all([
    enrichLocation(location),
    scrapeMarketData(product),
    pool.query(
      `SELECT price, location, recorded_at FROM market_prices
       WHERE product ILIKE $1 ORDER BY recorded_at DESC LIMIT 10`,
      [product]
    )
  ]);

  const historyText = dbHistory.length > 0
    ? dbHistory.map(r => `$${r.price} at ${r.location} on ${new Date(r.recorded_at).toDateString()}`).join(', ')
    : 'No price history yet';

  const prompt = `
You are PriceSense AI — a pricing assistant for informal market vendors in Zimbabwe.
You have deep knowledge of Zimbabwean informal market prices in USD across Harare markets like Mbare, CBD, Avondale, Ruwa, Chitungwiza, and others.
${conversationContext}

Vendor's latest question: "${context}"
Question type: ${question_type}
Product: ${product}
Market: ${locationData.display_name}

Live market data from Zimbabwean news sites:
${liveMarketData}

Price history from our database: ${historyText}

IMPORTANT RULES:
- Always give confident price estimates. Never say you don't have data.
- Use conversation history to understand follow-up questions correctly.
- For compare_markets: tell exactly which market is cheapest to BUY from and best to SELL in.
- For restock_advice: give YES/NO, where to buy, buy price, and sell price.
- For price_check: give current price range in that specific market.

Use simple English. Max 80 words. End with one practical tip.
  `;

  const response = await askGemini(prompt);

  await pool.query(
    `INSERT INTO price_queries (phone_number, product, location, ai_response)
     VALUES ($1, $2, $3, $4)`,
    [phone, product || 'general', location || 'Harare', response]
  );

  return response;
}

module.exports = { getPriceRecommendation };