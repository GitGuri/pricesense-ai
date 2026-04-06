const pool = require('../db');
const { sendMessage } = require('./whatsapp');
const { askGemini } = require('./gemini');

async function sendDailyAlerts() {
  try {
    // Get all registered vendors
    const { rows: vendors } = await pool.query(`
      SELECT DISTINCT phone_number, message 
      FROM conversations 
      WHERE role = 'system' AND message LIKE 'VENDOR_PROFILE:%'
    `);

    for (const vendor of vendors) {
      const profile = vendor.message.replace('VENDOR_PROFILE: ', '');
      const parts = {};
      profile.split(',').forEach(p => {
        const [k, v] = p.split('=');
        parts[k.trim()] = v.trim();
      });

      const { name, product, market } = parts;
      if (!product || !market) continue;

      // Get latest avg price vs yesterday
      const { rows: prices } = await pool.query(`
        SELECT 
          ROUND(AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '1 day' THEN price END)::numeric, 2) as today,
          ROUND(AVG(CASE WHEN recorded_at < NOW() - INTERVAL '1 day' 
                    AND recorded_at >= NOW() - INTERVAL '2 days' THEN price END)::numeric, 2) as yesterday
        FROM market_prices
        WHERE product ILIKE $1 AND location ILIKE $2
      `, [product, market]);

      const { today, yesterday } = prices[0];
      if (!today || !yesterday) continue;

      const change = ((today - yesterday) / yesterday * 100).toFixed(1);
      const direction = change > 0 ? '📈 UP' : '📉 DOWN';

      if (Math.abs(change) < 3) continue; // only alert on significant changes

      const prompt = `
You are PriceSense AI sending a daily price alert to ${name}, a vendor selling ${product} in ${market}, Zimbabwe.

Yesterday's price: $${yesterday}
Today's price: $${today}
Change: ${direction} ${Math.abs(change)}%

Write a short, friendly WhatsApp alert (max 50 words) telling them about this price change and one quick action they should take today. Be direct and practical.
      `;

      const alert = await askGemini(prompt);
      await sendMessage(vendor.phone_number, `🔔 *Daily Price Alert*\n\n${alert}`);
      console.log(`✅ Alert sent to ${vendor.phone_number} for ${product}`);
    }
  } catch (err) {
    console.error('Alert error:', err.message);
  }
}

module.exports = { sendDailyAlerts };