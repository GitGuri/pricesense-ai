const { askGemini } = require('../services/gemini');
const { enrichLocation } = require('../services/location');
const { scrapeMarketData } = require('../services/scraper');
const pool = require('../db');

async function getPriceRecommendation(parsed, phone, history = []) {
  const { product, location, question_type, context } = parsed;

  const conversationContext = history.length > 0
    ? history.map(h => `${h.role}: ${h.message}`).join('\n')
    : 'No previous messages';

  const [locationData, liveMarketData, { rows: dbHistory }] = await Promise.all([
    enrichLocation(location),
    scrapeMarketData(product),
    pool.query(
      `SELECT location, ROUND(AVG(price)::numeric,2) as avg_price,
              COUNT(*) as data_points
       FROM market_prices
       WHERE product ILIKE $1
       GROUP BY location
       ORDER BY avg_price ASC`,
      [product]
    )
  ]);

  const historyText = dbHistory.length > 0
    ? dbHistory.map(r => `${r.location}: $${r.avg_price} avg (${r.data_points} records)`).join('\n')
    : 'No price history yet';

  const prompt = `
You are PriceSense AI — a smart market trading assistant for Zimbabwean vendors.
You have deep knowledge of Zimbabwean informal market prices in USD.

VENDOR CONTEXT: ${context}
PRODUCT: ${product}
MARKET THEY ARE IN: ${locationData.display_name}

PRICE DATA ACROSS ALL MARKETS (sorted cheapest to most expensive):
${historyText}

LIVE MARKET DATA FROM ZIMBABWEAN NEWS SITES:
${liveMarketData}

CONVERSATION HISTORY:
${conversationContext}

YOUR INTELLIGENCE RULES — follow these strictly:

1. PROFIT LOGIC: If a vendor wants to know where to sell, ALWAYS recommend markets where
   the SELLING price is HIGHER than their BUYING price. Never recommend selling somewhere
   cheaper than they bought. Always calculate:
   Profit = Sell Price - Buy Price - Transport Cost

2. ZIMBABWE MARKET KNOWLEDGE — always apply this real-world knowledge:
   - Mbare is the CHEAPEST market (wholesale hub) — best place to BUY
   - Borrowdale, Avondale, Eastlea are EXPENSIVE suburbs — best place to SELL for high profit
   - CBD Harare is mid-range — good for high volume sales
   - Rural areas (Mutare, Masvingo, Karoi, Bindura) have LOWER prices than Harare suburbs
   - Transport from Mutare to Harare costs roughly $10-20 per trip depending on load
   - Transport within Harare costs $2-5 per trip
   - Seasonal produce (tomatoes, mangoes, butternuts) prices swing 30-50% between seasons
   - EcoCash is most common in high density suburbs
   - USD cash dominates in Mbare, CBD and rural markets

3. PRICE COMPARISON: When comparing markets always show a clear breakdown:
   Buy price → Transport cost → Sell price → NET PROFIT per kg or unit

4. UNKNOWN LOCATIONS: If you dont have data for a location estimate based on:
   - Nearby known locations and distance
   - Whether it is urban, rural or suburban
   - Distance from Harare (further away = cheaper produce, higher transport cost)

5. UNDERSTAND THE QUESTION:
   - "where can I sell" = find highest selling market that beats their buy price after transport
   - "should I restock" = compare current buy price vs potential sell price, give YES or NO
   - "what is the price" = give current market rate with range
   - "compare markets" = show a clear price table across markets
   - "I found X at $Y" = use that as the buy price and find best selling market

6. ALWAYS show actual profit potential with real numbers, not just prices.
7. NEVER recommend selling somewhere that results in a loss after transport costs.
8. If a vendor gives you their buy price, use that exact number in your calculations.

Keep response under 120 words. Be direct, specific and practical.
Show numbers clearly. End with one actionable tip.
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