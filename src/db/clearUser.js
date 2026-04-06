const pool = require('./index');
require('dotenv').config();

const phone = process.argv[2];

if (!phone) {
  console.log('Usage: node src/db/clearUser.js 263778177588');
  process.exit(1);
}

async function clear() {
  await pool.query(`DELETE FROM conversations WHERE phone_number = $1`, [phone]);
  console.log(`✅ Cleared conversation history for ${phone}`);
}

clear().catch(console.error).finally(() => process.exit());