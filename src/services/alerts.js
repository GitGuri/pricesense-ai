const pool = require('../db');
const { sendMessage } = require('./whatsapp');
const { askGemini } = require('./gemini');

async function sendDailyAlerts() {
  try {
    const { rows: vendors } = await pool.query(`
      SELECT DISTINCT phone_number, message 
      FROM conversations 
      WHERE role = 'system' AND message LIKE 'VENDOR_PROFILE:%'
    `);

    for (const vendor of vendors) {
      const profile = vendor.message.replace('VENDOR_PROFILE: ', '');
      const parts = {};
      profile.split(',').forEach(p => {
        const trimmed = p.trim();
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          parts[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
        }
      });

      const { name, products, location } = parts;
      if (!products || !location) continue;

      // Handle multiple products — alert on first one
      const primaryProduct = products.split(/[,\/]/)[0].trim();

      const { rows: prices } = await pool.query(`
        SELECT 
          ROUND(AVG(CASE WHEN recorded_at >= NOW() - INTERVAL '1 day' THEN price END)::numeric, 2) as today,
          ROUND(AVG(CASE WHEN recorded_at < NOW() - INTERVAL '1 day' 
                    AND recorded_at >= NOW() - INTERVAL '2 days' THEN price END)::numeric, 2) as yesterday
        FROM market_prices
        WHERE product ILIKE $1 AND location ILIKE $2
      `, [primaryProduct, location]);

      const { today, yesterday } = prices[0];
      if (!today || !yesterday) continue;

      const change = ((today - yesterday) / yesterday * 100).toFixed(1);
      const direction = parseFloat(change) > 0 ? '📈 UP' : '📉 DOWN';
      const arrow = parseFloat(change) > 0 ? '⬆️' : '⬇️';

      if (Math.abs(change) < 3) continue;

      const prompt = `
You are PriceSense AI sending a daily price alert to ${name}, a Zimbabwean vendor selling ${primaryProduct} in ${location}.

Yesterday's price: $${yesterday}/kg
Today's price: $${today}/kg
Change: ${direction} ${Math.abs(change)}%

Write a short WhatsApp alert in Shona-English mix (max 50 words).
Start with "Mangwanani ${name}! 🌅"
Tell them the price change and one quick action for today.
Use Shona words naturally: mutengo, kutenga, kutengesa, zvakawanda, zvakanaka, chipa.
      `;

      const alert = await askGemini(prompt);

      const message = 
        `🔔 *PriceSense — Mutengo Wanhasi*\n\n` +
        `${alert}\n\n` +
        `📊 ${primaryProduct}: $${yesterday} → $${today}/kg ${arrow} ${Math.abs(change)}%`;

      await sendMessage(vendor.phone_number, message);
      console.log(`✅ Alert sent to ${vendor.phone_number} for ${primaryProduct}`);
    }
  } catch (err) {
    console.error('Alert error:', err.message);
  }
}

module.exports = { sendDailyAlerts };